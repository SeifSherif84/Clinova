using AutoMapper;
using Domain.Contracts;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Domain.Exceptions.BadRequest;
using Domain.Exceptions.Forbidden;
using Domain.Exceptions.InternalServerError;
using Domain.Exceptions.NotFound;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Services.Abstractions.Appointments;
using Services.Abstractions.AppointmentSlots;
using Services.Abstractions.Paymob;
using Services.Commen;
using Services.Specifications.Appointments;
using Services.Specifications.AppointmentSlots;
using Services.Specifications.ClinicManualPaymentMethods;
using Shared.Dtos.Appointments;
using Shared.Dtos.ClinovaSettings;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Appointments
{
    public class AppointmentService(IUnitOfWork _unitOfWork,
                                    IMapper _mapper,
                                    IOptions<CancellationPolicySettings> _cancellationPolicyOptions,
                                    IPaymobRefundService _refundService) : IAppointmentService
    {
        private readonly CancellationPolicySettings _cancellationPolicy = _cancellationPolicyOptions.Value;


        public async Task<string> PatientCreateAppointmentAsync(string userId, int appointmentSlotId, CreateAppointmentRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var patient = await _unitOfWork.GetRepository<Patient, string>().GetByIdAsync(userId);
            if (patient is null)
                throw new NotFoundException("We couldn't find your account.");

            var slotRepository = _unitOfWork.GetRepository<AppointmentSlot, int>();
            var slot = await slotRepository.GetByIdAsync(appointmentSlotId);

            if (slot is null)
                throw new NotFoundException("The selected appointment slot was not found.");

            if (slot.Status != SlotStatus.Available)
                throw new BadRequestException("The selected appointment slot is no longer available.");

            var slotDateTime = slot.Date.ToDateTime(slot.StartTime);
            var nowInEgypt = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time"));
            if (slotDateTime <= nowInEgypt)
                throw new BadRequestException("You cannot book a past appointment slot.");


            var doctorClinicAccess = await GetDoctorClinicAccessAsync(slot.DoctorId, slot.ClinicId);

            var consultationFee = doctorClinicAccess.Clinic.ConsultationFee;
            var depositAmount = Math.Round(consultationFee * doctorClinicAccess.Clinic.DepositPercentage / 100m,  2, MidpointRounding.AwayFromZero);
            var remainingAmount = consultationFee - depositAmount;

            var appointment = new Appointment
            {
                BookingDate = DateTime.UtcNow,
                Status = AppointmentStatus.PendingPayment,
                PatientId = userId,
                AppointmentSlotId = appointmentSlotId,
                PatientNotes = request.PatientNotes,
                ConsultationFee = consultationFee,
                DepositAmount = depositAmount,
                RemainingAmount = remainingAmount,
                ReservationExpiresAt = DateTime.UtcNow.AddMinutes(30),
                FullRefundCancellationWindowMinutes = _cancellationPolicy.FullRefundCancellationWindowMinutes,
                BookingCancellationGracePeriodMinutes = _cancellationPolicy.BookingCancellationGracePeriodMinutes
            };

            appointment.Payment = new Payment
            {
                Amount = depositAmount,
                CreatedAt = DateTime.UtcNow,
                Status = PaymentStatus.Pending,
                Appointment = appointment   
            };

            slot.Status = SlotStatus.Reserved;

            // Add Appointment & Payment
            await _unitOfWork.GetRepository<Appointment, int>().AddAsync(appointment);

            // Save Appointment + Payment + Slot change
            try
            {
                var result = await _unitOfWork.SaveChangesAsync();
                if (result == 0)
                    throw new InternalServerErrorException(
                        "We couldn't create your appointment right now. Please try again later.");
            }
            catch (DbUpdateException ex)
            // B. Race Condition one of them accept exception from DB B. the index which I add it (here i catch this exception and return bad request)
            when (ex.InnerException is SqlException sqlException && (sqlException.Number == 2601 || sqlException.Number == 2627))
            {
                throw new BadRequestException("The selected appointment slot is no longer available.");
            }

            return "Your appointment has been reserved. Please complete the payment before the reservation expires.";
        }



        public async Task<IEnumerable<PatientAppointmentResponse>> GetPatientAppointmentsAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var patient = await _unitOfWork.GetRepository<Patient, string>().GetByIdAsync(userId);
            if (patient is null)
                throw new NotFoundException("We couldn't find your account.");

            var appointmentRepo = _unitOfWork.GetRepository<Appointment, int>();
            var appointmentSpec = AppointmentSpecifications.ByPatientId(userId);
            var appointments = await appointmentRepo.GetAllAsync(appointmentSpec);
            if (!appointments.Any())
                return Enumerable.Empty<PatientAppointmentResponse>();

            return _mapper.Map<IEnumerable<PatientAppointmentResponse>>(appointments);
        }



        public async Task<PatientAppointmentDetailsResponse> GetPatientAppointmentDetailsAsync(string userId, int appointmentId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var patient = await _unitOfWork.GetRepository<Patient, string>().GetByIdAsync(userId);
            if (patient is null)
                throw new NotFoundException("We couldn't find your account.");

            var appointmentRepo = _unitOfWork.GetRepository<Appointment, int>();
            var appointmentSpec = AppointmentSpecifications.ByIdWithDetails(appointmentId);
            var appointment = await appointmentRepo.GetByIdAsync(appointmentSpec);
            if (appointment is null)
                throw new NotFoundException("The appointment was not found.");

            if (appointment.PatientId != userId)
                throw new ResourceAccessDeniedException("You are not authorized to get this appointment.");

            return _mapper.Map<PatientAppointmentDetailsResponse>(appointment);
        }



        public async Task<CancelAppointmentResponse> CancelAppointmentByPatientAsync(string userId, int appointmentId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var patient = await _unitOfWork.GetRepository<Patient, string>().GetByIdAsync(userId);
            if (patient is null)
                throw new NotFoundException("We couldn't find your account.");

            var appointmentRepo = _unitOfWork.GetRepository<Appointment, int>();
            var appointmentSpec = AppointmentSpecifications.ForCancellation(appointmentId);
            var appointment =  await appointmentRepo.GetByIdAsync(appointmentSpec);

            if (appointment is null)
                throw new NotFoundException("The appointment was not found.");

            if (appointment.PatientId != userId)
                throw new ResourceAccessDeniedException("You are not authorized to cancel this appointment.");

            if (appointment.Status == AppointmentStatus.Cancelled)
                throw new BadRequestException("This appointment has already been cancelled.");

            if (appointment.Status == AppointmentStatus.Completed)
                throw new BadRequestException("A completed appointment cannot be cancelled.");

            if (appointment.Status == AppointmentStatus.NoShow)
                throw new BadRequestException("A no-show appointment cannot be cancelled.");

            if (appointment.Status == AppointmentStatus.Expired)
                throw new BadRequestException("This appointment has already expired.");

            if (appointment.Status != AppointmentStatus.PendingPayment && appointment.Status != AppointmentStatus.Confirmed)
                throw new BadRequestException("This appointment cannot be cancelled at its current status.");


            // ---------------------------------------------------------
            // Determine payment and refund eligibility
            // ---------------------------------------------------------

            var payment = appointment.Payment;

            if (payment is null)
                throw new InternalServerErrorException("The payment associated with this appointment could not be found.");

            var isPaymentPaid = payment.Status == PaymentStatus.Paid;
            var isFullRefundEligible = isPaymentPaid && IsFullRefundEligible(appointment);


            // ---------------------------------------------------------
            // Cancel Appointment
            // ---------------------------------------------------------

            appointment.Status = AppointmentStatus.Cancelled;


            // ---------------------------------------------------------
            // Cancel unpaid payment
            //
            // Paid payment must remain Paid until the actual refund
            // is successfully processed by Paymob.
            // ---------------------------------------------------------

            if (!isPaymentPaid)
                payment.Status = PaymentStatus.Cancelled;



            // ---------------------------------------------------------
            // Release appointment slot
            // ---------------------------------------------------------

            if (appointment.AppointmentSlot.Status == SlotStatus.Reserved || appointment.AppointmentSlot.Status == SlotStatus.Booked)
                appointment.AppointmentSlot.Status = SlotStatus.Available;


            // ---------------------------------------------------------
            // Save cancellation first
            // ---------------------------------------------------------

            try
            {
                var result = await _unitOfWork.SaveChangesAsync();

                if (result == 0)
                {
                    throw new InternalServerErrorException(
                        "We couldn't cancel your appointment right now. Please try again later.");
                }
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new BadRequestException(
                    "This appointment was modified by another operation. Please refresh and try again.");
            }


            // ---------------------------------------------------------
            // Payment was never completed
            // ---------------------------------------------------------

            if (!isPaymentPaid)
            {
                return new CancelAppointmentResponse
                {
                    AppointmentId = appointment.Id,
                    AppointmentStatus = appointment.Status.ToString(),
                    RefundEligible = false,
                    RefundEligibility = RefundEligibilityStatus.NotApplicable.ToString(),
                    RefundStatus = null,
                    RefundAmount = 0,
                    Message = "Your appointment has been cancelled successfully."
                };
            }


            // ---------------------------------------------------------
            // Payment was completed but cancellation is not
            // eligible for refund.
            // ---------------------------------------------------------

            if (!isFullRefundEligible)
            {
                return new CancelAppointmentResponse
                {
                    AppointmentId = appointment.Id,
                    AppointmentStatus = appointment.Status.ToString(),
                    RefundEligible = false,
                    RefundEligibility = RefundEligibilityStatus.NotEligible.ToString(),
                    RefundStatus = null,
                    RefundAmount = 0,
                    Message = "Your appointment has been cancelled. According to Clinova's cancellation policy, this payment is not eligible for a refund."
                };
            }


            // ---------------------------------------------------------
            // Payment was completed and patient is eligible for refund.
            //
            // Do NOT mark Payment as Refunded here.
            // RefundService will call Paymob and update the payment
            // only after the refund is confirmed.
            // ---------------------------------------------------------

            var refundResult = await _refundService.RefundPaymentAsync(payment.Id, RefundReason.PatientCancellation);


            // ---------------------------------------------------------
            // Refund successfully processed
            // ---------------------------------------------------------

            if (refundResult.Succeeded)
            {
                return new CancelAppointmentResponse
                {
                    AppointmentId = appointment.Id,
                    AppointmentStatus = appointment.Status.ToString(),
                    RefundEligible = true,
                    RefundEligibility = RefundEligibilityStatus.Eligible.ToString(),
                    RefundStatus = RefundStatus.Succeeded.ToString(),
                    RefundAmount = appointment.DepositAmount,
                    Message = "Your appointment has been cancelled and your deposit refund has been processed successfully."
                };
            }


            // ---------------------------------------------------------
            // Paymob result could not be safely confirmed.
            //
            // IMPORTANT:
            // Do not retry the refund immediately.
            // RefundService will keep it in PendingVerification.
            // ---------------------------------------------------------

            if (refundResult.PendingVerification)
            {
                return new CancelAppointmentResponse
                {
                    AppointmentId = appointment.Id,
                    AppointmentStatus = appointment.Status.ToString(),
                    RefundEligible = true,
                    RefundEligibility = RefundEligibilityStatus.Eligible.ToString(),
                    RefundStatus = RefundStatus.PendingVerification.ToString(),
                    RefundAmount = appointment.DepositAmount,
                    Message = "Your appointment has been cancelled. Your refund is being processed and will be confirmed shortly."
                };
            }


            // ---------------------------------------------------------
            // Paymob definitely rejected the refund request.
            // ---------------------------------------------------------

            return new CancelAppointmentResponse
            {
                AppointmentId = appointment.Id,
                AppointmentStatus = appointment.Status.ToString(),
                RefundEligible = true,
                RefundEligibility = RefundEligibilityStatus.Eligible.ToString(),
                RefundStatus = RefundStatus.Failed.ToString(),
                RefundAmount = appointment.DepositAmount,
                Message = "Your appointment has been cancelled, but we could not process the refund at this time. The refund will be retried after verification."
            };
        }



        private static bool IsFullRefundEligible(Appointment appointment)
        {
            var nowUtc = DateTime.UtcNow;
            var bookingGracePeriodEndsAtUtc = appointment.BookingDate.AddMinutes(appointment.BookingCancellationGracePeriodMinutes);
            if (nowUtc <= bookingGracePeriodEndsAtUtc)
                return true;

            var appointmentStartUtc = GetAppointmentStartUtc(appointment);
            var fullRefundDeadlineUtc = appointmentStartUtc.AddMinutes(-appointment.FullRefundCancellationWindowMinutes);
            return nowUtc <= fullRefundDeadlineUtc;
        }


        private static DateTime GetAppointmentStartUtc(Appointment appointment)
        {
            var egyptTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
            var appointmentLocalDateTime = appointment.AppointmentSlot.Date.ToDateTime(appointment.AppointmentSlot.StartTime);
            return TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(appointmentLocalDateTime, DateTimeKind.Unspecified), egyptTimeZone);
        }




        public CancellationPolicyResponse GetCancellationPolicyAsync()
        {
            var cancellationWindow = FormatDuration(_cancellationPolicy.FullRefundCancellationWindowMinutes);

            var gracePeriod = FormatDuration(_cancellationPolicy.BookingCancellationGracePeriodMinutes);

            var response = new CancellationPolicyResponse
            {
                FullRefundCancellationWindowMinutes = _cancellationPolicy.FullRefundCancellationWindowMinutes,
                BookingCancellationGracePeriodMinutes = _cancellationPolicy.BookingCancellationGracePeriodMinutes,

                FullRefundCancellationDescription = $"You will receive a full refund if you cancel your appointment at least " +
                                                    $"{cancellationWindow} before the appointment.",

                BookingGracePeriodDescription = $"You will receive a full refund if you cancel within " +
                                                $"{gracePeriod} of booking.",

                NoRefundDescription = $"Cancellations made less than {cancellationWindow} before the appointment " +
                                      $"after the booking grace period are not eligible for a refund.",

                ClinicCancellationDescription = "If the clinic cancels your confirmed appointment, your deposit will be fully refunded."
            };

            return response;
        }

        private static string FormatDuration(int minutes)
        {
            if (minutes < 60)
                return $"{minutes} minutes";

            var hours = minutes / 60;
            var remainingMinutes = minutes % 60;

            if (remainingMinutes == 0)
                return hours == 1 ?
                       "1 hour" :
                       $"{hours} hours";

            return hours == 1 ? 
                   $"1 hour and {remainingMinutes} minutes" : 
                   $"{hours} hours and {remainingMinutes} minutes";
        }




        public async Task ExpirePendingAppointmentsAsync()
        {
            var now = DateTime.UtcNow;
            var appointmentRepo = _unitOfWork.GetRepository<Appointment, int>();
            var specification = AppointmentSpecifications.GetExpiredPendingPaymentAppointments(now);
            var appointments = await appointmentRepo.GetAllAsync(specification);

            if (!appointments.Any())
                return;

            foreach (var appointment in appointments)
            {
                appointment.Status = AppointmentStatus.Expired;

                if (appointment.Payment.Status is PaymentStatus.Pending or PaymentStatus.Failed)
                    appointment.Payment.Status = PaymentStatus.Expired;

                if (appointment.AppointmentSlot.Status == SlotStatus.Reserved)
                    appointment.AppointmentSlot.Status = SlotStatus.Available;
            }

            await _unitOfWork.SaveChangesAsync();
        }



        public async Task<CancelAppointmentResponse> CancelAppointmentByDoctorAsync(string doctorId, int appointmentId)
        {
            if (string.IsNullOrWhiteSpace(doctorId))
                throw new BadRequestException("We couldn't identify your account.");

            var doctor = await _unitOfWork.GetRepository<Doctor, string>().GetByIdAsync(doctorId);
            if (doctor is null)
                throw new NotFoundException("We couldn't find your account.");


            var appointmentRepo = _unitOfWork.GetRepository<Appointment, int>();
            var appointmentSpec =AppointmentSpecifications.ForCancellation(appointmentId);
            var appointment = await appointmentRepo.GetByIdAsync(appointmentSpec);
            if (appointment is null)
                throw new NotFoundException("The appointment was not found.");


            // ---------------------------------------------------------
            // Verify that this appointment belongs to this doctor
            // ---------------------------------------------------------

            if (appointment.AppointmentSlot.DoctorId != doctorId)
                throw new ResourceAccessDeniedException(
                    "You are not authorized to cancel this appointment.");


            var clinicId = appointment.AppointmentSlot.ClinicId;
            var doctorClinicRepo = _unitOfWork.GetRepository<DoctorClinic>();
            var doctorClinic = await doctorClinicRepo.GetByCompositeKeyAsync(doctorId, clinicId);
            if (doctorClinic is null)
            {
                throw new ForbiddenException(
                    "You are no longer a member of this clinic and are not authorized to cancel this appointment.");
            }



            // ---------------------------------------------------------
            // Doctor can only cancel a confirmed appointment.
            //
            // PendingPayment appointments are intentionally ignored.
            // They are not real confirmed bookings yet.
            // ---------------------------------------------------------

            if (appointment.Status != AppointmentStatus.Confirmed)
                throw new BadRequestException(
                    "Only confirmed appointments can be cancelled by the doctor.");


            // ---------------------------------------------------------
            // Payment must actually be completed.
            // ---------------------------------------------------------

            var payment = appointment.Payment;

            if (payment is null)
                throw new InternalServerErrorException("The payment associated with this appointment could not be found.");


            if (payment.Status != PaymentStatus.Paid)
                throw new BadRequestException("Only appointments with a completed payment can be cancelled by the doctor.");


            // ---------------------------------------------------------
            // Slot must be booked.
            // ---------------------------------------------------------

            if (appointment.AppointmentSlot.Status != SlotStatus.Booked)
                throw new BadRequestException("The appointment slot is not currently booked.");


            // ---------------------------------------------------------
            // Cancel Appointment
            // ---------------------------------------------------------

            appointment.Status = AppointmentStatus.Cancelled;


            // ---------------------------------------------------------
            // Release booked slot
            // ---------------------------------------------------------

            appointment.AppointmentSlot.Status = SlotStatus.Available;


            // ---------------------------------------------------------
            // Save cancellation first.
            //
            // Payment remains Paid at this point.
            // RefundService will change it to Refunded only
            // after Paymob confirms the refund.
            // ---------------------------------------------------------

            try
            {
                var result = await _unitOfWork.SaveChangesAsync();

                if (result == 0)
                {
                    throw new InternalServerErrorException(
                        "We couldn't cancel the appointment right now. Please try again later.");
                }
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new BadRequestException(
                    "This appointment was modified by another operation. Please refresh and try again.");
            }


            // ---------------------------------------------------------
            // Clinic cancellation always gets a full refund.
            //
            // Unlike patient cancellation, we do NOT check:
            // - 10-minute booking grace period
            // - 2-hour cancellation window
            //
            // Clinic/Doctor cancellation = full deposit refund.
            // ---------------------------------------------------------

            var refundResult = await _refundService.RefundPaymentAsync(payment.Id, RefundReason.ClinicCancellation);


            // ---------------------------------------------------------
            // Refund successfully processed
            // ---------------------------------------------------------

            if (refundResult.Succeeded)
            {
                return new CancelAppointmentResponse
                {
                    AppointmentId = appointment.Id,
                    AppointmentStatus = appointment.Status.ToString(),
                    RefundEligible = true,
                    RefundEligibility = RefundEligibilityStatus.Eligible.ToString(),
                    RefundStatus = RefundStatus.Succeeded.ToString(),
                    RefundAmount = appointment.DepositAmount,
                    Message = "The appointment has been cancelled and the patient's deposit refund has been processed successfully."
                };
            }


            // ---------------------------------------------------------
            // Refund result is uncertain.
            // ---------------------------------------------------------

            if (refundResult.PendingVerification)
            {
                return new CancelAppointmentResponse
                {
                    AppointmentId = appointment.Id,
                    AppointmentStatus = appointment.Status.ToString(),
                    RefundEligible = true,
                    RefundEligibility = RefundEligibilityStatus.Eligible.ToString(),
                    RefundStatus = RefundStatus.PendingVerification.ToString(),
                    RefundAmount = appointment.DepositAmount,
                    Message = "The appointment has been cancelled. The patient's refund is being processed and will be confirmed shortly."
                };
            }


            // ---------------------------------------------------------
            // Paymob definitely rejected the refund.
            // ---------------------------------------------------------

            return new CancelAppointmentResponse
            {
                AppointmentId = appointment.Id,
                AppointmentStatus = appointment.Status.ToString(),
                RefundEligible = true,
                RefundEligibility = RefundEligibilityStatus.Eligible.ToString(),
                RefundStatus = RefundStatus.Failed.ToString(),
                RefundAmount = appointment.DepositAmount,
                Message = "The appointment has been cancelled, but we could not process the patient's refund at this time. The refund will be retried after verification."
            };
        }





        public async Task<PaginatedResult<SecretaryAppointmentResponse>> GetClinicAppointmentsForSecretaryAsync(string secretaryId, int clinicId, SecretaryAppointmentQuery query)
        {
            if (string.IsNullOrWhiteSpace(secretaryId))
                throw new BadRequestException("We couldn't identify your account.");


            var secretaryRepo = _unitOfWork.GetRepository<Secretary, string>();
            var secretary = await secretaryRepo.GetByIdAsync(secretaryId);
            if (secretary is null)
                throw new NotFoundException("We couldn't find your account.");


            if (secretary.ClinicId != clinicId)
                throw new ResourceAccessDeniedException("You are not authorized to access this clinic's appointments.");



            var pageIndex = query.PageIndex < 1 ? 1 : Math.Min(query.PageIndex, 100);
            var pageSize = query.PageSize < 1 ? 10 : Math.Min(query.PageSize, 100); 


            var doctorName = string.IsNullOrWhiteSpace(query.DoctorName) ? null : query.DoctorName.Trim(); 


            // ---------------------------------------------------------
            // 7. Build count specification
            //
            // Important:
            // No pagination and no unnecessary Includes are applied
            // for the count query.
            // ---------------------------------------------------------

            var countSpecification = AppointmentSpecifications.ForClinicSecretary(clinicId,
                                                                                  doctorName,
                                                                                  query.SlotDate,
                                                                                  query.AppointmentStatus,
                                                                                  query.PaymentStatus,
                                                                                  pageIndex,
                                                                                  pageSize,
                                                                                  applyPagination: false);


            var appointmentRepository = _unitOfWork.GetRepository<Appointment, int>();

            var totalCount = await appointmentRepository.CountAsync(countSpecification);


            // ---------------------------------------------------------
            // 8. Build paginated data specification
            // ---------------------------------------------------------

            var dataSpecification = AppointmentSpecifications.ForClinicSecretary(clinicId,
                                                                                 doctorName,
                                                                                 query.SlotDate,
                                                                                 query.AppointmentStatus,
                                                                                 query.PaymentStatus,
                                                                                 pageIndex,
                                                                                 pageSize,
                                                                                 applyPagination: true);


            // ---------------------------------------------------------
            // 9. Get current page
            // ---------------------------------------------------------

            var appointments = await appointmentRepository.GetAllAsync(dataSpecification);


            // ---------------------------------------------------------
            // 10. Map entities to response DTO
            // ---------------------------------------------------------

            var items = appointments.Select(appointment => new SecretaryAppointmentResponse
                {
                    Id = appointment.Id,


                    // Appointment Slot
                    SlotDate = appointment.AppointmentSlot.Date,
                    StartTime = appointment.AppointmentSlot.StartTime,
                    EndTime = appointment.AppointmentSlot.EndTime,
                      

                    // Appointment
                    AppointmentStatus = appointment.Status.ToString(),
                     

                    // Doctor
                    DoctorName = $"{appointment.AppointmentSlot.Doctor.FirstName} {appointment.AppointmentSlot.Doctor.LastName}",


                    // Patient
                    PatientName = $"{appointment.Patient.FirstName} {appointment.Patient.LastName}",
                    //PatientPhoneNumber = appointment.Patient.PhoneNumber,


                // Payment
                PaymentStatus = appointment.Payment.Status.ToString(),
                PaymentType = appointment.Payment.ClinicManualPaymentMethodId.HasValue ? PaymentType.Manual.ToString() : PaymentType.Online.ToString(),
                //ManualPaymentMethod = appointment.Payment.ClinicManualPaymentMethod?.Type,
                //PaymentAmount = appointment.Payment.Amount,
                //RemainingAmount = appointment.RemainingAmount,
                //PaymentProofUrl = appointment.Payment.PaymentProofUrl,
                //TransactionReference = appointment.Payment.TransactionReference
                })
                .ToList();


            // ---------------------------------------------------------
            // 11. Return paginated result
            // ---------------------------------------------------------

            return new PaginatedResult<SecretaryAppointmentResponse>
            {
                PageIndex = pageIndex,
                PageSize = pageSize,
                TotalCount = totalCount,
                Items = items
            };
        }

        public async Task<SecretaryAppointmentDetailsResponse> GetClinicAppointmentDetailsForSecretaryAsync(string secretaryId, int appointmentId, int clinicId)
        {
            if (string.IsNullOrWhiteSpace(secretaryId))
                throw new BadRequestException("We couldn't identify your account.");


            var secretaryRepo = _unitOfWork.GetRepository<Secretary, string>();
            var secretary = await secretaryRepo.GetByIdAsync(secretaryId);
            if (secretary is null)
                throw new NotFoundException("We couldn't find your account.");


            if (secretary.ClinicId != clinicId)
                throw new ResourceAccessDeniedException("You are not authorized to access this clinic's appointments.");

            var appointmentRepo = _unitOfWork.GetRepository<Appointment, int>();
            var appointmentSpec = AppointmentSpecifications.ByIdWithDetailsForSecretary(appointmentId);
            var appointment = await appointmentRepo.GetByIdAsync(appointmentSpec);

            if (appointment is null)
                throw new NotFoundException("The appointment was not found.");

            if (appointment.AppointmentSlot.ClinicId != clinicId)
                throw new ResourceAccessDeniedException("You are not authorized to view this appointment.");


            return new SecretaryAppointmentDetailsResponse()
            {
                Id = appointment.Id,
                SlotDate = appointment.AppointmentSlot.Date,
                StartTime = appointment.AppointmentSlot.StartTime,
                EndTime = appointment.AppointmentSlot.EndTime,
                AppointmentStatus = appointment.Status.ToString(),
                DoctorName = $"{appointment.AppointmentSlot.Doctor.FirstName} {appointment.AppointmentSlot.Doctor.LastName}",
                PatientName = $"{appointment.Patient.FirstName} {appointment.Patient.LastName}",
                PatientPhoneNumber = appointment.Patient.PhoneNumber!,
                PaymentStatus = appointment.Payment.Status.ToString(),
                PaymentType = appointment.Payment.ClinicManualPaymentMethodId.HasValue ? PaymentType.Manual.ToString() : PaymentType.Online.ToString(),
                ManualPaymentMethodType = appointment.Payment.ClinicManualPaymentMethod?.Type.ToString(),
                PaymentAmount = appointment.Payment.Amount,
                RemainingAmount = appointment.RemainingAmount,
                PaymentProofUrl = appointment.Payment.PaymentProofUrl,
                TransactionReference = appointment.Payment.TransactionReference
            };
        }



        private async Task<DoctorClinicContext> GetDoctorClinicAccessAsync(string doctorId, int clinicId)
        {
            if (string.IsNullOrWhiteSpace(doctorId))
                throw new BadRequestException("Doctor ID is required.");


            var doctorRepo = _unitOfWork.GetRepository<Doctor, string>();
            var doctor = await doctorRepo.GetByIdAsync(doctorId);
            if (doctor is null)
                throw new NotFoundException("The doctor associated with this appointment was not found.");


            var clinicRepo = _unitOfWork.GetRepository<Clinic, int>();
            var clinic = await clinicRepo.GetByIdAsync(clinicId);
            if (clinic is null)
                throw new NotFoundException("The clinic associated with this appointment is not available.");


            var doctorClinicRepo = _unitOfWork.GetRepository<DoctorClinic>();
            var doctorClinic = await doctorClinicRepo.GetByCompositeKeyAsync(doctor.Id, clinic.Id);
            if (doctorClinic is null)
                throw new ResourceAccessDeniedException("This doctor currently does not belong to this clinic.");

            if (doctor.ApprovalStatus != DoctorApprovalStatus.Approved)
                throw new BadRequestException("This doctor is not currently available for appointments.");


            return new DoctorClinicContext
            {
                Doctor = doctor,
                Clinic = clinic,
                DoctorClinic = doctorClinic,
                IsOwner = doctorClinic.IsOwner
            };
        }


    }
}
