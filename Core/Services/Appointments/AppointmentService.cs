using AutoMapper;
using Domain.Contracts;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Domain.Entities.Identity;
using Domain.Exceptions.BadRequest;
using Domain.Exceptions.Forbidden;
using Domain.Exceptions.InternalServerError;
using Domain.Exceptions.NotFound;
using Domain.Exceptions.Unauthorized;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Services.Abstractions.Appointments;
using Services.Abstractions.AppointmentSlots;
using Services.Abstractions.Notifications;
using Services.Abstractions.Paymob;
using Services.Commen;
using Services.FileStorage;
using Services.Notifications;
using Services.Specifications.Appointments;
using Services.Specifications.AppointmentSlots;
using Services.Specifications.ClinicManualPaymentMethods;
using Services.Specifications.Secretaries;
using Shared.Dtos.Appointments;
using Shared.Dtos.ClinovaSettings;
using Shared.Dtos.Paymob;
using Stripe;
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
                                    IPaymobRefundService _refundService,
                                    INotificationService _notificationService) : IAppointmentService
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
                BookingSource = BookingSource.Patient,
                BookingType = BookingType.Advance,
                PatientId = userId,
                AppointmentSlotId = appointmentSlotId,
                PatientNotes = request.PatientNotes,
                ConsultationFee = consultationFee,
                DepositAmount = depositAmount,
                RemainingAmount = remainingAmount,
                ReservationExpiresAt = DateTime.UtcNow.AddMinutes(2),
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




        public CancellationPolicyResponse GetCancellationPolicy()
        {
            var cancellationWindow = FormatDuration(_cancellationPolicy.FullRefundCancellationWindowMinutes);
            var gracePeriod = FormatDuration(_cancellationPolicy.BookingCancellationGracePeriodMinutes);

            var response = new CancellationPolicyResponse
            {
                FullRefundCancellationWindowMinutes = _cancellationPolicy.FullRefundCancellationWindowMinutes,
                BookingCancellationGracePeriodMinutes = _cancellationPolicy.BookingCancellationGracePeriodMinutes,
                FullRefundCancellationDescription = $"You will receive a full refund if you cancel your appointment at least {cancellationWindow} before the appointment.",
                BookingGracePeriodDescription = $"You will receive a full refund if you cancel within {gracePeriod} of booking.",
                NoRefundDescription = $"Cancellations made less than {cancellationWindow} before the appointment after the booking grace period are not eligible for a refund.",
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

            foreach (var appointment in appointments)
            {
                if (appointment.PatientId is not null)
                {
                    await _notificationService.CreateAndSendAsync(
                        appointment.PatientId,
                        "Appointment Expired",
                        $"Your appointment reservation #{appointment.Id} has expired because the payment was not completed in time.",
                        NotificationType.AppointmentExpired);
                }
            }
        }




        //public async Task<CancelAppointmentResponse> CancelAppointmentByDoctorAsync(string doctorId, int appointmentId)
        //{
        //    if (string.IsNullOrWhiteSpace(doctorId))
        //        throw new BadRequestException("We couldn't identify your account.");

        //    var doctor = await _unitOfWork.GetRepository<Doctor, string>().GetByIdAsync(doctorId);
        //    if (doctor is null)
        //        throw new NotFoundException("We couldn't find your account.");


        //    var appointmentRepo = _unitOfWork.GetRepository<Appointment, int>();
        //    var appointmentSpec =AppointmentSpecifications.ForCancellation(appointmentId);
        //    var appointment = await appointmentRepo.GetByIdAsync(appointmentSpec);
        //    if (appointment is null)
        //        throw new NotFoundException("The appointment was not found.");


        //    // ---------------------------------------------------------
        //    // Verify that this appointment belongs to this doctor
        //    // ---------------------------------------------------------

        //    if (appointment.AppointmentSlot.DoctorId != doctorId)
        //        throw new ResourceAccessDeniedException(
        //            "You are not authorized to cancel this appointment.");


        //    var clinicId = appointment.AppointmentSlot.ClinicId;
        //    var doctorClinicRepo = _unitOfWork.GetRepository<DoctorClinic>();
        //    var doctorClinic = await doctorClinicRepo.GetByCompositeKeyAsync(doctorId, clinicId);
        //    if (doctorClinic is null)
        //    {
        //        throw new ForbiddenException(
        //            "You are no longer a member of this clinic and are not authorized to cancel this appointment.");
        //    }



        //    // ---------------------------------------------------------
        //    // Doctor can only cancel a confirmed appointment.
        //    //
        //    // PendingPayment appointments are intentionally ignored.
        //    // They are not real confirmed bookings yet.
        //    // ---------------------------------------------------------

        //    if (appointment.Status != AppointmentStatus.Confirmed)
        //        throw new BadRequestException(
        //            "Only confirmed appointments can be cancelled by the doctor.");


        //    // ---------------------------------------------------------
        //    // Payment must actually be completed.
        //    // ---------------------------------------------------------

        //    var payment = appointment.Payment;

        //    if (payment is null)
        //        throw new InternalServerErrorException("The payment associated with this appointment could not be found.");


        //    if (payment.Status != PaymentStatus.Paid)
        //        throw new BadRequestException("Only appointments with a completed payment can be cancelled by the doctor.");


        //    // ---------------------------------------------------------
        //    // Slot must be booked.
        //    // ---------------------------------------------------------

        //    if (appointment.AppointmentSlot.Status != SlotStatus.Booked)
        //        throw new BadRequestException("The appointment slot is not currently booked.");


        //    // ---------------------------------------------------------
        //    // Cancel Appointment
        //    // ---------------------------------------------------------

        //    appointment.Status = AppointmentStatus.Cancelled;


        //    // ---------------------------------------------------------
        //    // Release booked slot
        //    // ---------------------------------------------------------

        //    appointment.AppointmentSlot.Status = SlotStatus.Available;


        //    // ---------------------------------------------------------
        //    // Save cancellation first.
        //    //
        //    // Payment remains Paid at this point.
        //    // RefundService will change it to Refunded only
        //    // after Paymob confirms the refund.
        //    // ---------------------------------------------------------

        //    try
        //    {
        //        var result = await _unitOfWork.SaveChangesAsync();

        //        if (result == 0)
        //        {
        //            throw new InternalServerErrorException(
        //                "We couldn't cancel the appointment right now. Please try again later.");
        //        }
        //    }
        //    catch (DbUpdateConcurrencyException)
        //    {
        //        throw new BadRequestException(
        //            "This appointment was modified by another operation. Please refresh and try again.");
        //    }


        //    // ---------------------------------------------------------
        //    // Clinic cancellation always gets a full refund.
        //    //
        //    // Unlike patient cancellation, we do NOT check:
        //    // - 10-minute booking grace period
        //    // - 2-hour cancellation window
        //    //
        //    // Clinic/Doctor cancellation = full deposit refund.
        //    // ---------------------------------------------------------

        //    var refundResult = await _refundService.RefundPaymentAsync(payment.Id, RefundReason.ClinicCancellation);


        //    // ---------------------------------------------------------
        //    // Refund successfully processed
        //    // ---------------------------------------------------------

        //    if (refundResult.Succeeded)
        //    {
        //        return new CancelAppointmentResponse
        //        {
        //            AppointmentId = appointment.Id,
        //            AppointmentStatus = appointment.Status.ToString(),
        //            RefundEligible = true,
        //            RefundEligibility = RefundEligibilityStatus.Eligible.ToString(),
        //            RefundStatus = RefundStatus.Succeeded.ToString(),
        //            RefundAmount = appointment.DepositAmount,
        //            Message = "The appointment has been cancelled and the patient's deposit refund has been processed successfully."
        //        };
        //    }


        //    // ---------------------------------------------------------
        //    // Refund result is uncertain.
        //    // ---------------------------------------------------------

        //    if (refundResult.PendingVerification)
        //    {
        //        return new CancelAppointmentResponse
        //        {
        //            AppointmentId = appointment.Id,
        //            AppointmentStatus = appointment.Status.ToString(),
        //            RefundEligible = true,
        //            RefundEligibility = RefundEligibilityStatus.Eligible.ToString(),
        //            RefundStatus = RefundStatus.PendingVerification.ToString(),
        //            RefundAmount = appointment.DepositAmount,
        //            Message = "The appointment has been cancelled. The patient's refund is being processed and will be confirmed shortly."
        //        };
        //    }


        //    // ---------------------------------------------------------
        //    // Paymob definitely rejected the refund.
        //    // ---------------------------------------------------------

        //    return new CancelAppointmentResponse
        //    {
        //        AppointmentId = appointment.Id,
        //        AppointmentStatus = appointment.Status.ToString(),
        //        RefundEligible = true,
        //        RefundEligibility = RefundEligibilityStatus.Eligible.ToString(),
        //        RefundStatus = RefundStatus.Failed.ToString(),
        //        RefundAmount = appointment.DepositAmount,
        //        Message = "The appointment has been cancelled, but we could not process the patient's refund at this time. The refund will be retried after verification."
        //    };
        //}





        public async Task<PaginatedResult<SecretaryAppointmentResponse>> GetClinicAppointmentsForSecretaryAsync(string secretaryId, SecretaryAppointmentQuery query)
        {
            if (string.IsNullOrWhiteSpace(secretaryId))
                throw new BadRequestException("We couldn't identify your account.");


            var secretaryRepo = _unitOfWork.GetRepository<Secretary, string>();
            var secretary = await secretaryRepo.GetByIdAsync(secretaryId);
            if (secretary is null)
                throw new NotFoundException("We couldn't find your account.");

            if (secretary.ClinicId is null)
                throw new BadRequestException("You are not associated with any clinic.");
            int clinicId = secretary.ClinicId.Value;


            var pageIndex = query.PageIndex < 1 ? 1 : Math.Min(query.PageIndex, 100);
            var pageSize = query.PageSize < 1 ? 10 : Math.Min(query.PageSize, 100); 


            var doctorName = string.IsNullOrWhiteSpace(query.DoctorName) ? null : query.DoctorName.Trim(); 
            var patientSearch = string.IsNullOrWhiteSpace(query.PatientSearch) ? null : query.PatientSearch.Trim();


            var countSpecification = AppointmentSpecifications.ForClinicSecretary(clinicId,
                                                                                  doctorName,
                                                                                  patientSearch,
                                                                                  query.SlotDate,
                                                                                  query.AppointmentStatus,
                                                                                  query.PaymentStatus,
                                                                                  pageIndex,
                                                                                  pageSize,
                                                                                  applyPagination: false);


            var appointmentRepo = _unitOfWork.GetRepository<Appointment, int>();

            var totalCount = await appointmentRepo.CountAsync(countSpecification);


            var dataSpecification = AppointmentSpecifications.ForClinicSecretary(clinicId,
                                                                                 doctorName,
                                                                                 patientSearch,
                                                                                 query.SlotDate,
                                                                                 query.AppointmentStatus,
                                                                                 query.PaymentStatus,
                                                                                 pageIndex,
                                                                                 pageSize,
                                                                                 applyPagination: true);


            var appointments = await appointmentRepo.GetAllAsync(dataSpecification);

            var items = _mapper.Map<List<SecretaryAppointmentResponse>>(appointments);

            return new PaginatedResult<SecretaryAppointmentResponse>
            {
                PageIndex = pageIndex,
                PageSize = pageSize,
                TotalCount = totalCount,
                Items = items
            };
        }


        public async Task<SecretaryAppointmentDetailsResponse> GetClinicAppointmentDetailsForSecretaryAsync(string secretaryId, int appointmentId)
        {
            if (string.IsNullOrWhiteSpace(secretaryId))
                throw new BadRequestException("We couldn't identify your account.");


            var secretaryRepo = _unitOfWork.GetRepository<Secretary, string>();
            var secretary = await secretaryRepo.GetByIdAsync(secretaryId);
            if (secretary is null)
                throw new NotFoundException("We couldn't find your account.");

            if (secretary.ClinicId is null)
                throw new BadRequestException("You are not associated with any clinic.");


            var appointmentRepo = _unitOfWork.GetRepository<Appointment, int>();
            var appointmentSpec = AppointmentSpecifications.ByIdWithDetailsForSecretary(appointmentId);
            var appointment = await appointmentRepo.GetByIdAsync(appointmentSpec);

            if (appointment is null)
                throw new NotFoundException("The appointment was not found.");

            if (secretary.ClinicId != appointment.AppointmentSlot.ClinicId)
                throw new ResourceAccessDeniedException("You are not authorized to view this appointment.");


            return _mapper.Map<SecretaryAppointmentDetailsResponse>(appointment);
        }


        public async Task<string> CancelAppointmentByPatientAsync(string userId, int appointmentId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var patient = await _unitOfWork.GetRepository<Patient, string>().GetByIdAsync(userId);
            if (patient is null)
                throw new NotFoundException("We couldn't find your account.");

            var appointmentRepo = _unitOfWork.GetRepository<Appointment, int>();
            var appointmentSpec = AppointmentSpecifications.ForCancellation(appointmentId);
            var appointment = await appointmentRepo.GetByIdAsync(appointmentSpec);

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


            var payment = appointment.Payment;

            if (payment is null)
                throw new InternalServerErrorException("The payment associated with this appointment could not be found.");

            var isPaymentPaid = payment.Status == PaymentStatus.Paid;
            var isFullRefundEligible = isPaymentPaid && IsFullRefundEligible(appointment);

            appointment.Status = AppointmentStatus.Cancelled;

            if (appointment.AppointmentSlot.Status == SlotStatus.Reserved || appointment.AppointmentSlot.Status == SlotStatus.Booked)
                appointment.AppointmentSlot.Status = SlotStatus.Available;


            if (!isPaymentPaid)
            {
                payment.Status = PaymentStatus.Cancelled;
                var result = await _unitOfWork.SaveChangesAsync();
                if (result == 0)
                    throw new InternalServerErrorException(
                        "You couldn't cancel your appointment right now. Please try again later.");

                return "Your appointment has been cancelled successfully.";
            }


            if (!isFullRefundEligible)
            {
                var result = await _unitOfWork.SaveChangesAsync();
                if (result == 0)
                    throw new InternalServerErrorException(
                        "You couldn't cancel your appointment right now. Please try again later.");

                var secretarySpec = SecretarySpecifications.GetSecretariesByClinicId(appointment.AppointmentSlot.ClinicId);
                var secretaries = await _unitOfWork.GetRepository<Secretary, string>().GetAllAsync(secretarySpec);

                foreach (var secretary in secretaries)
                {
                    await _notificationService.CreateAndSendAsync(
                        secretary.Id,
                        "Appointment Cancelled",
                        $"A patient has cancelled appointment #{appointment.Id}. The slot is now available.",
                        NotificationType.AppointmentCancelled);
                }

                return "Your appointment has been cancelled. According to Clinova's cancellation policy, this payment is not eligible for a refund.";
            }


            var hasPaymobTransaction = payment.MethodType == PaymentMethodType.Paymob;
            var hasManualPaymentMethod = payment.MethodType == PaymentMethodType.ManualTransfer;


            if (hasManualPaymentMethod)
            {
                var paymentRefund = new PaymentRefund
                {
                    PaymentId = payment.Id,
                    Reason = RefundReason.PatientCancellation,
                    Status = RefundStatus.PendingManualProcessing,
                    Amount = payment.Amount,
                    RequestedAt = DateTime.UtcNow,
                    ProcessedAt = null,
                    IdempotencyKey = $"manual-refund-payment-{payment.Id}"
                };

                var paymentRefundRepo = _unitOfWork.GetRepository<PaymentRefund, int>();
                await paymentRefundRepo.AddAsync(paymentRefund);

                try
                {
                    var result = await _unitOfWork.SaveChangesAsync();
                    if (result == 0)
                        throw new InternalServerErrorException(
                            "You couldn't cancel your appointment right now. Please try again later.");
                }
                catch (DbUpdateConcurrencyException)
                {
                    throw new InternalServerErrorException(
                        "The appointment or payment was modified by another operation. Please refresh and check its current status.");
                }
                catch (DbUpdateException)
                {
                    throw new InternalServerErrorException(
                        "We couldn't save the cancellation and refund request. Please check the current appointment and refund status before retrying.");
                }


                var secretarySpec = SecretarySpecifications.GetSecretariesByClinicId(appointment.AppointmentSlot.ClinicId);
                var secretaries = await _unitOfWork.GetRepository<Secretary, string>().GetAllAsync(secretarySpec);

                foreach (var secretary in secretaries)
                {
                    await _notificationService.CreateAndSendAsync(
                        secretary.Id,
                        "Refund Request Requires Processing",
                        $"Appointment #{appointment.Id} was cancelled by the patient. A full refund of {payment.Amount} requires manual processing.",
                        NotificationType.ManualRefundRequested);
                }


                return "Your appointment has been cancelled successfully. According to Clinova's cancellation policy, your refund has been approved and is awaiting manual processing by the clinic.";
            }



            // ---------------------------------------------------------
            // Do NOT mark Payment as Refunded here.
            // RefundService will call Paymob and update the payment
            // only after the refund is confirmed.
            // ---------------------------------------------------------

            if (hasPaymobTransaction)
            {
                if (string.IsNullOrWhiteSpace(payment.ProviderTransactionId))
                    throw new BadRequestException("The Paymob transaction ID is missing.");

                var refundResult = await _refundService.RefundPaymentAsync(payment.Id, RefundReason.PatientCancellation);

                var secretarySpec = SecretarySpecifications.GetSecretariesByClinicId(appointment.AppointmentSlot.ClinicId);
                var secretaries = await _unitOfWork.GetRepository<Secretary, string>().GetAllAsync(secretarySpec);

                foreach (var secretary in secretaries)
                {
                    await _notificationService.CreateAndSendAsync(
                        secretary.Id,
                        "Appointment Cancelled - Refund Eligible",
                        $"A patient has cancelled appointment #{appointment.Id}. The patient is eligible for a refund according to Clinova's cancellation policy.",
                        NotificationType.AppointmentCancelled);
                }

                if (refundResult.Succeeded)
                    return "Your appointment has been cancelled successfully. According to Clinova's cancellation policy, your refund has been approved and processed successfully.";

                if (refundResult.PendingVerification)
                    return "Your appointment has been cancelled successfully. According to Clinova's cancellation policy, your refund has been approved and is awaiting confirmation.";


                return "Your appointment has been cancelled successfully. According to Clinova's cancellation policy, your refund has been approved, but it could not be processed at this time.";
            }


            else
                throw new InternalServerErrorException("The payment method could not be determined.");
        }


        public async Task<string> CancelAppointmentBySecretaryRequestedByClinicOrDoctorAsync(string secretaryId, int appointmentId)
        {
            if (string.IsNullOrWhiteSpace(secretaryId))
                throw new BadRequestException("We couldn't identify your account.");

            var secretary = await _unitOfWork.GetRepository<Secretary, string>().GetByIdAsync(secretaryId);

            if (secretary is null)
                throw new NotFoundException("We couldn't find your account.");

            if (secretary.ClinicId is null)
                throw new BadRequestException("You are not associated with any clinic.");


            var appointmentRepo = _unitOfWork.GetRepository<Appointment, int>();
            var appointmentSpec = AppointmentSpecifications.ForCancellation(appointmentId);
            var appointment = await appointmentRepo.GetByIdAsync(appointmentSpec);

            if (appointment is null)
                throw new NotFoundException("The appointment was not found.");

            if (appointment.AppointmentSlot is null)
                throw new InternalServerErrorException("The appointment slot associated with this appointment could not be found.");

            if (secretary.ClinicId != appointment.AppointmentSlot.ClinicId)
                throw new ResourceAccessDeniedException("You are not authorized to cancel this appointment.");

            if (appointment.Status != AppointmentStatus.Confirmed)
                throw new BadRequestException("Only confirmed appointments can be cancelled.");


            var payment = appointment.Payment;
            if (payment is null)
                throw new InternalServerErrorException("The payment associated with this appointment could not be found.");

            if (payment.Status != PaymentStatus.Paid)
                throw new BadRequestException("Only appointments with a completed payment can be cancelled.");


            if (appointment.AppointmentSlot.Status != SlotStatus.Booked)
                throw new BadRequestException("The appointment slot is not currently booked.");


            var hasPaymobTransaction = payment.MethodType == PaymentMethodType.Paymob;
            var hasManualPaymentMethod = payment.MethodType == PaymentMethodType.ManualTransfer;
            var hasCashPaymentMethod = payment.MethodType == PaymentMethodType.CashAtClinic;


            appointment.Status = AppointmentStatus.Cancelled;
            appointment.AppointmentSlot.Status = SlotStatus.Available;


            if (hasManualPaymentMethod || hasCashPaymentMethod)
            {
                var paymentRefund = new PaymentRefund
                {
                    PaymentId = payment.Id,
                    Reason = RefundReason.ClinicCancellation,
                    Status = RefundStatus.PendingManualProcessing,
                    Amount = payment.Amount,
                    RequestedAt = DateTime.UtcNow,
                    ProcessedAt = null,
                    IdempotencyKey = $"manual-refund-payment-{payment.Id}"
                };

                var paymentRefundRepo = _unitOfWork.GetRepository<PaymentRefund, int>();
                await paymentRefundRepo.AddAsync(paymentRefund);

                try
                {
                    var result = await _unitOfWork.SaveChangesAsync();
                    if (result == 0)
                        throw new InternalServerErrorException(
                            "We couldn't cancel the appointment and save its refund request. Please try again.");
                }
                catch (DbUpdateConcurrencyException)
                {
                    throw new InternalServerErrorException(
                        "The appointment or payment was modified by another operation. Please refresh and check its current status.");
                }
                catch (DbUpdateException)
                {
                    throw new InternalServerErrorException(
                        "We couldn't save the cancellation and refund request. Please check the current appointment and refund status before retrying.");
                }

                if (appointment.PatientId is not null)
                {
                    await _notificationService.CreateAndSendAsync(
                        appointment.PatientId,
                        "Appointment Cancelled",
                        $"Your appointment #{appointment.Id} has been cancelled by the clinic. Your refund is awaiting manual processing by the clinic.",
                        NotificationType.AppointmentCancelledByClinic);
                }

                return "The appointment has been cancelled successfully. The patient's refund is awaiting manual processing by the clinic.";
            }


            if (hasPaymobTransaction)
            {
                if (string.IsNullOrWhiteSpace(payment.ProviderTransactionId))
                    throw new BadRequestException("The Paymob transaction ID is missing.");

                var refundResult = await _refundService.RefundPaymentAsync(payment.Id, RefundReason.ClinicCancellation);

                if (appointment.PatientId is not null)
                {
                    await _notificationService.CreateAndSendAsync(
                        appointment.PatientId,
                        "Appointment Cancelled",
                        $"Your appointment #{appointment.Id} has been cancelled by the clinic. Your refund is being processed according to Clinova's cancellation policy.",
                        NotificationType.AppointmentCancelledByClinic);
                }

                if (refundResult.Succeeded)
                    return "The appointment has been cancelled successfully. The patient's refund has been processed.";

                if (refundResult.PendingVerification)
                    return "The appointment has been cancelled successfully. The patient's refund is being processed and is awaiting confirmation.";

                return "The appointment has been cancelled successfully, but the patient's refund could not be processed at this time.";
            }

            else
                throw new InternalServerErrorException("The payment method could not be determined.");
        }


        public async Task<string> CancelAppointmentBySecretaryRequestedByPatientAsync(string secretaryId, int appointmentId,
                                                                                      CancelGuestAppointmentBySecretaryRequestedByPatientRequest request)
        {
            if (string.IsNullOrWhiteSpace(secretaryId))
                throw new BadRequestException("We couldn't identify your account.");

            var secretary = await _unitOfWork.GetRepository<Secretary, string>().GetByIdAsync(secretaryId);

            if (secretary is null)
                throw new NotFoundException("We couldn't find your account.");

            if (secretary.ClinicId is null)
                throw new BadRequestException("You are not associated with any clinic.");

            var appointmentRepo = _unitOfWork.GetRepository<Appointment, int>();
            var appointmentSpec = AppointmentSpecifications.ForCancellation(appointmentId);
            var appointment = await appointmentRepo.GetByIdAsync(appointmentSpec);

            if (appointment is null)
                throw new NotFoundException("The appointment was not found.");

            if (appointment.AppointmentSlot is null)
                throw new InternalServerErrorException("The appointment slot associated with this appointment could not be found.");

            if (secretary.ClinicId != appointment.AppointmentSlot.ClinicId)
                throw new ResourceAccessDeniedException("You are not authorized to cancel this appointment.");

            if (appointment.Status != AppointmentStatus.Confirmed)
                throw new BadRequestException("Only confirmed appointments can be cancelled.");

            var payment = appointment.Payment;

            if (payment is null)
                throw new InternalServerErrorException("The payment associated with this appointment could not be found.");

            if (payment.Status != PaymentStatus.Paid)
                throw new BadRequestException("Only appointments with a completed payment can be cancelled.");

            if (appointment.AppointmentSlot.Status != SlotStatus.Booked)
                throw new BadRequestException("The appointment slot is not currently booked.");

            if (payment.Refund is not null)
                throw new BadRequestException("A refund already exists for this payment.");



            var isGuestReservation = appointment.BookingSource == BookingSource.Secretary && string.IsNullOrWhiteSpace(appointment.PatientId);
            var isRegisteredPatientReservation = appointment.BookingSource == BookingSource.Patient && !string.IsNullOrWhiteSpace(appointment.PatientId);

            if (!isGuestReservation && !isRegisteredPatientReservation)
                throw new BadRequestException("This operation is only available for valid patient reservations.");


            appointment.Status = AppointmentStatus.Cancelled;
            appointment.AppointmentSlot.Status = SlotStatus.Available;

            if (isGuestReservation && request.IsRefundDue is null)
                throw new BadRequestException("IsRefundDue is required for guest reservations.");

            var isRefundEligible = isGuestReservation ? request.IsRefundDue!.Value : IsFullRefundEligible(appointment);

            PaymentRefund? refund = null;
            var shouldProcessPaymobRefund = false;


            // ---------------------------------------------------------
            // Case 1: No refund is due.
            // ---------------------------------------------------------
            if (!isRefundEligible)
            {
                try
                {
                    var result = await _unitOfWork.SaveChangesAsync();
                    if (result == 0)
                        throw new InternalServerErrorException("We couldn't cancel the appointment. Please try again.");
                }
                catch (DbUpdateConcurrencyException)
                {
                    throw new InternalServerErrorException("The appointment or payment was modified by another operation. Please refresh and check its current status.");
                }
                catch (DbUpdateException)
                {
                    throw new InternalServerErrorException("We couldn't save the cancellation. Please check the appointment status before retrying.");
                }

                if(isRegisteredPatientReservation)
                {
                    await _notificationService.CreateAndSendAsync(
                        appointment.PatientId!,
                        "Appointment Cancelled",
                        $"Your appointment #{appointment.Id} has been cancelled by the clinic. According to Clinova's cancellation policy, this payment is not eligible for a refund.",
                        NotificationType.AppointmentCancelledByClinic);
                }

                return isGuestReservation
                    ? "The appointment has been cancelled successfully. No refund will be issued, as the secretary did not approve the refund."
                    : "The appointment has been cancelled successfully. According to Clinova's cancellation policy, this payment is not eligible for a refund.";
            }


            // ---------------------------------------------------------
            // Case 2: Guest reservation with a refund.
            // ---------------------------------------------------------
            if (isRefundEligible && isGuestReservation)
            {
                if (payment.MethodType != PaymentMethodType.ManualTransfer && payment.MethodType != PaymentMethodType.CashAtClinic)
                    throw new BadRequestException("The payment method is not supported for guest reservation refunds.");

                refund = new PaymentRefund
                {
                    PaymentId = payment.Id,
                    Reason = RefundReason.PatientCancellation,
                    Status = RefundStatus.PendingManualProcessing,
                    Amount = payment.Amount,
                    RequestedAt = DateTime.UtcNow,
                    ProcessedAt = null,
                    IdempotencyKey = $"guest-patient-cancel-refund-{payment.Id}"
                };

                await _unitOfWork.GetRepository<PaymentRefund, int>().AddAsync(refund);
            }


            // ---------------------------------------------------------
            // Case 3: Registered patient with a refund.
            // ---------------------------------------------------------
            else if (isRefundEligible && isRegisteredPatientReservation)
            {
                if (payment.MethodType != PaymentMethodType.Paymob && payment.MethodType != PaymentMethodType.ManualTransfer)
                    throw new BadRequestException("The payment method is not supported for patient registered reservation refunds.");

                if (payment.MethodType == PaymentMethodType.Paymob)
                    shouldProcessPaymobRefund = true;

                else if(payment.MethodType == PaymentMethodType.ManualTransfer)
                {
                    refund = new PaymentRefund
                    {
                        PaymentId = payment.Id,
                        Reason = RefundReason.PatientCancellation,
                        Status = RefundStatus.PendingManualProcessing,
                        Amount = payment.Amount,
                        RequestedAt = DateTime.UtcNow,
                        ProcessedAt = null,
                        IdempotencyKey = $"manual-refund-payment-{payment.Id}"
                    };

                    await _unitOfWork.GetRepository<PaymentRefund, int>().AddAsync(refund);
                }

                else
                    throw new BadRequestException("The payment method does not support this refund operation.");
            }



            // ---------------------------------------------------------
            // Save the cancellation, released slot, and any manual refund.
            // ---------------------------------------------------------
            try
            {
                var result = await _unitOfWork.SaveChangesAsync();
                if (result == 0)
                    throw new InternalServerErrorException("We couldn't cancel the appointment and save its refund request. Please try again.");
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new InternalServerErrorException("The appointment or payment was modified by another operation. Please refresh and check its current status.");
            }
            catch (DbUpdateException)
            {
                throw new InternalServerErrorException("We couldn't save the cancellation and refund request. Please check the current appointment and refund status before retrying.");
            }


            if (isRegisteredPatientReservation && !shouldProcessPaymobRefund)
            {
                await _notificationService.CreateAndSendAsync(
                    appointment.PatientId!,
                    "Appointment Cancelled - Refund Pending",
                    $"Your appointment #{appointment.Id} has been cancelled by the clinic. Your refund is awaiting manual processing by the clinic.",
                    NotificationType.AppointmentCancelledByClinic);
            }


            if (shouldProcessPaymobRefund)
            {
                var refundResult = await _refundService.RefundPaymentAsync(payment.Id, RefundReason.PatientCancellation);

                if (isRegisteredPatientReservation)
                {
                    await _notificationService.CreateAndSendAsync(
                        appointment.PatientId!,
                        "Appointment Cancelled - Refund Eligible",
                        $"Your appointment #{appointment.Id} has been cancelled by the clinic. Your refund is being processed according to Clinova's cancellation policy.",
                        NotificationType.AppointmentCancelledByClinic);
                }

                if (refundResult.Succeeded)
                    return "Your appointment has been cancelled successfully. According to Clinova's cancellation policy, your refund has been approved and processed successfully.";

                if (refundResult.PendingVerification)
                    return "Your appointment has been cancelled successfully. According to Clinova's cancellation policy, your refund has been approved and is awaiting confirmation.";

                return "Your appointment has been cancelled successfully. According to Clinova's cancellation policy, your refund has been approved, but it could not be processed at this time.";
            }


            return isGuestReservation
                ? "The guest appointment has been cancelled successfully. The patient's refund is awaiting manual processing by the clinic, as you approved the refund."
                : "The appointment has been cancelled successfully. According to Clinova's cancellation policy, the refund has been approved and is awaiting manual processing by the clinic."; ;

        }





        public async Task<string> PatientSubmitManualPaymentProofAsync(string userId, int appointmentId, SubmitManualPaymentProofRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var patient = await _unitOfWork.GetRepository<Patient, string>().GetByIdAsync(userId);
            if (patient is null)
                throw new NotFoundException("We couldn't find your account.");


            var appointmentRepo = _unitOfWork.GetRepository<Appointment, int>();
            var appointmentSpec = AppointmentSpecifications.ById(appointmentId);
            var appointment = await appointmentRepo.GetByIdAsync(appointmentSpec);

            if (appointment is null)
                throw new NotFoundException("The appointment was not found.");

            if (appointment.PatientId != userId)
                throw new ResourceAccessDeniedException("You are not allowed to submit payment for this appointment.");

            if (appointment.Status != AppointmentStatus.PendingPayment)
                throw new BadRequestException("Payment proof can only be submitted for appointments awaiting payment.");

            if (appointment.Payment is null)
                throw new BadRequestException("Payment information for this appointment was not found.");

            if (appointment.Payment.Status != PaymentStatus.Pending)
                throw new BadRequestException("Payment proof can only be submitted when the payment is pending.");

            if (appointment.ReservationExpiresAt <= DateTime.UtcNow)
                throw new BadRequestException("This reservation has expired. Please book another available slot.");

            if (appointment.AppointmentSlot is null)
                throw new NotFoundException("The appointment slot associated with this appointment was not found.");

            if (appointment.AppointmentSlot.Status != SlotStatus.Reserved)
                throw new BadRequestException("The appointment slot is no longer reserved. Please book another available slot.");



            var manualPaymentMethod = await _unitOfWork.GetRepository<ClinicManualPaymentMethod, int>().GetByIdAsync(request.ClinicManualPaymentMethodId);

            if (manualPaymentMethod is null)
                throw new NotFoundException("The selected payment method was not found.");

            if (!manualPaymentMethod.IsActive)
                throw new BadRequestException("The selected payment method is no longer active.");

            if (manualPaymentMethod.ClinicId != appointment.AppointmentSlot.ClinicId)
                throw new BadRequestException("The selected payment method does not belong to this appointment's clinic.");



            if (request.TransactionReference is not null)
                request.TransactionReference = request.TransactionReference.Trim();


            string? uploadedFileName = null;
            try
            {
                uploadedFileName = await FileStorageHandler.UploadAsync(request.PaymentProof, "manualpaymentproofs");
                appointment.Payment.ManualPaymentProofUrl = uploadedFileName;
                appointment.Payment.ClinicManualPaymentMethodId = manualPaymentMethod.Id;
                appointment.Payment.MethodType = PaymentMethodType.ManualTransfer;
                appointment.Payment.TransactionReference = request.TransactionReference;
                appointment.Payment.Status = PaymentStatus.PendingVerification;
                appointment.Status = AppointmentStatus.PendingVerification;


                var result = await _unitOfWork.SaveChangesAsync();
                if (result == 0)
                    throw new InternalServerErrorException("We couldn't submit your payment proof right now. Please try again later.");
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!string.IsNullOrWhiteSpace(uploadedFileName))
                    FileStorageHandler.Delete(uploadedFileName, "manualpaymentproofs");

                throw new BadRequestException("This appointment or payment has changed. Please refresh and try again.");
            }
            catch
            {
                if (!string.IsNullOrWhiteSpace(uploadedFileName))
                    FileStorageHandler.Delete(uploadedFileName, "manualpaymentproofs");

                throw;
            }


            var secretaryRepo = _unitOfWork.GetRepository<Secretary, string>();
            var secretarySpec = SecretarySpecifications.GetSecretariesByClinicId(appointment.AppointmentSlot.ClinicId);
            var secretaries = await _unitOfWork.GetRepository<Secretary, string>().GetAllAsync(secretarySpec);

            foreach(var secretary in secretaries)
            {
                await _notificationService.CreateAndSendAsync(
                    secretary.Id,
                    "Payment Proof Submitted",
                    $"Payment proof has been submitted for appointment #{appointment.Id}. Please review and verify the payment.",
                    NotificationType.ManualPaymentSubmitted);
            }

            return "Your payment proof has been submitted successfully and is waiting for clinic verification.";
        }


        public async Task<string> ApproveManualPaymentAsync(string secretaryId, int appointmentId)
        {
            if (string.IsNullOrWhiteSpace(secretaryId))
                throw new BadRequestException("We couldn't identify your account.");

            var secretary = await _unitOfWork.GetRepository<Secretary, string>().GetByIdAsync(secretaryId);
            if (secretary is null)
                throw new NotFoundException("We couldn't find your account.");

            var appointmentRepo = _unitOfWork.GetRepository<Appointment, int>();
            var appointmentSpec = AppointmentSpecifications.ById(appointmentId);
            var appointment = await appointmentRepo.GetByIdAsync(appointmentSpec);
            if (appointment is null)
                throw new NotFoundException("The appointment was not found.");

            if (secretary.ClinicId != appointment.AppointmentSlot.ClinicId)
                throw new ResourceAccessDeniedException("You are not authorized to manage payments for this appointment.");

            if (appointment.Payment is null)
                throw new BadRequestException("Payment information for this appointment was not found.");

            if (appointment.Status != AppointmentStatus.PendingVerification || appointment.Payment.Status != PaymentStatus.PendingVerification)
                throw new BadRequestException("This appointment is no longer awaiting payment verification.");


            if (!appointment.Payment.ClinicManualPaymentMethodId.HasValue)
                throw new BadRequestException("This appointment does not use manual payment.");

            if (string.IsNullOrWhiteSpace(appointment.Payment.ManualPaymentProofUrl))
                throw new BadRequestException("No payment proof was submitted for this appointment.");

            if (appointment.AppointmentSlot.Status != SlotStatus.Reserved)
                throw new BadRequestException("The appointment slot is no longer reserved.");

            appointment.Payment.Status = PaymentStatus.Paid;
            appointment.Payment.PaidAt = DateTime.UtcNow;
            appointment.Payment.SecretaryRejectionReason = null;
            appointment.Status = AppointmentStatus.Confirmed;
            appointment.AppointmentSlot.Status = SlotStatus.Booked;

            try
            {
                var result = await _unitOfWork.SaveChangesAsync();
                if (result == 0)
                    throw new InternalServerErrorException("You couldn't approve this payment right now. Please try again later.");
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new BadRequestException("This appointment or payment has already been modified. Please refresh and try again.");
            }

            if (appointment.PatientId is not null)
            {
                await _notificationService.CreateAndSendAsync(
                    appointment.PatientId,
                    "Payment Approved",
                    $"Your payment proof for appointment #{appointment.Id} has been approved, and your appointment is now confirmed.",
                    NotificationType.ManualPaymentApproved);
            }

            return "The manual payment has been approved and the appointment is confirmed.";
        }


        public async Task<string> RejectManualPaymentAsync(string secretaryId, int appointmentId, RejectManualPaymentRequest request)
        {
            if (string.IsNullOrWhiteSpace(secretaryId))
                throw new BadRequestException("We couldn't identify your account.");

            var secretary = await _unitOfWork.GetRepository<Secretary, string>().GetByIdAsync(secretaryId);
            if (secretary is null)
                throw new NotFoundException("We couldn't find your account.");

            var rejectionReason = request.Reason.Trim();

            var appointmentRepo = _unitOfWork.GetRepository<Appointment, int>();
            var appointmentSpec = AppointmentSpecifications.ById(appointmentId);
            var appointment = await appointmentRepo.GetByIdAsync(appointmentSpec);
            if (appointment is null)
                throw new NotFoundException("The appointment was not found.");

            if (secretary.ClinicId != appointment.AppointmentSlot.ClinicId)
                throw new ResourceAccessDeniedException("You are not authorized to manage payments for this appointment.");

            if (appointment.Payment is null)
                throw new BadRequestException("Payment information for this appointment was not found.");

            if (appointment.Status != AppointmentStatus.PendingVerification || appointment.Payment.Status != PaymentStatus.PendingVerification)
                throw new BadRequestException("This appointment is no longer awaiting payment verification.");


            if (!appointment.Payment.ClinicManualPaymentMethodId.HasValue)
                throw new BadRequestException("This appointment does not use manual payment.");

            if (string.IsNullOrWhiteSpace(appointment.Payment.ManualPaymentProofUrl))
                throw new BadRequestException("No payment proof was submitted for this appointment.");

            if (appointment.AppointmentSlot.Status != SlotStatus.Reserved)
                throw new BadRequestException("The appointment slot is no longer reserved.");

            appointment.Payment.Status = PaymentStatus.Rejected;
            appointment.Payment.SecretaryRejectionReason = rejectionReason;
            appointment.Status = AppointmentStatus.Cancelled;
            appointment.AppointmentSlot.Status = SlotStatus.Available;

            try
            {
                var result = await _unitOfWork.SaveChangesAsync();
                if (result == 0)
                    throw new InternalServerErrorException("We couldn't reject this payment right now. Please try again later.");
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new BadRequestException("This appointment or payment has already been modified. Please refresh and try again.");
            }


            if (appointment.PatientId is not null)
            {
                await _notificationService.CreateAndSendAsync(
                    appointment.PatientId,
                    "Payment Rejected",
                    $"Your payment for appointment #{appointment.Id} has been rejected. Reason: {rejectionReason}. Your appointment has been cancelled.",
                    NotificationType.ManualPaymentRejected);
            }

            return "The manual payment has been rejected and the appointment has been cancelled.";
        }





        public async Task<string> SecretaryMarkAppointmentCompletedAsync(string secretaryId, int appointmentId)
        {
            if (string.IsNullOrWhiteSpace(secretaryId))
                throw new BadRequestException("We couldn't identify your account.");

            var secretary = await _unitOfWork.GetRepository<Secretary, string>().GetByIdAsync(secretaryId);
            if (secretary is null)
                throw new NotFoundException("We couldn't find your account.");

            if (secretary.ClinicId is null)
                throw new BadRequestException("You are not associated with any clinic.");


            var appointmentRepo = _unitOfWork.GetRepository<Appointment, int>();
            var appointmentSpec = AppointmentSpecifications.ById(appointmentId);
            var appointment = await appointmentRepo.GetByIdAsync(appointmentSpec);
            if (appointment is null)
                throw new NotFoundException("The appointment was not found.");

            if (appointment.AppointmentSlot is null)
                throw new InternalServerErrorException("The appointment slot associated with this appointment could not be found.");

            if (secretary.ClinicId != appointment.AppointmentSlot.ClinicId)
                throw new ResourceAccessDeniedException("You are not authorized to access this appointment.");

            if (appointment.Status != AppointmentStatus.Confirmed)
                throw new BadRequestException("Only confirmed appointments can be marked as completed.");

            if (appointment.AppointmentSlot.Status != SlotStatus.Booked)
                throw new BadRequestException("The appointment slot is not currently booked.");


            var payment = appointment.Payment;
            if (payment is null)
                throw new InternalServerErrorException("The payment associated with this appointment could not be found.");

            if (payment.Status != PaymentStatus.Paid)
                throw new BadRequestException("Only appointments with a completed payment can be marked as completed.");


            var nowUtc = DateTime.UtcNow;
            var egyptTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
            var appointmentLocalEndDateTime = appointment.AppointmentSlot.Date.ToDateTime(appointment.AppointmentSlot.EndTime);
            var appointmentEndUtc = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(appointmentLocalEndDateTime, DateTimeKind.Unspecified), egyptTimeZone);
            if (nowUtc < appointmentEndUtc)
                throw new BadRequestException("The appointment cannot be marked as completed before its scheduled end time.");

            if (appointment.Status == AppointmentStatus.Completed)
                throw new BadRequestException("This appointment has already been marked as completed.");

            appointment.Status = AppointmentStatus.Completed;

            if (appointment.RemainingAmount > 0)
                appointment.RemainingAmountCollectedAt = DateTime.UtcNow;

            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException(
                    "We couldn't mark the appointment as completed right now. Please try again later.");

            return "The appointment has been marked as completed successfully.";
        }


        public async Task<string> SecretaryMarkAppointmentNoShowAsync(string secretaryId, int appointmentId)
        {
            if (string.IsNullOrWhiteSpace(secretaryId))
                throw new BadRequestException("We couldn't identify your account.");

            var secretary = await _unitOfWork.GetRepository<Secretary, string>().GetByIdAsync(secretaryId);
            if (secretary is null)
                throw new NotFoundException("We couldn't find your account.");

            if (secretary.ClinicId is null)
                throw new BadRequestException("You are not associated with any clinic.");


            var appointmentRepo = _unitOfWork.GetRepository<Appointment, int>();
            var appointmentSpec = AppointmentSpecifications.ById(appointmentId);
            var appointment = await appointmentRepo.GetByIdAsync(appointmentSpec);
            if (appointment is null)
                throw new NotFoundException("The appointment was not found.");

            if (appointment.AppointmentSlot is null)
                throw new InternalServerErrorException("The appointment slot associated with this appointment could not be found.");

            if (secretary.ClinicId != appointment.AppointmentSlot.ClinicId)
                throw new ResourceAccessDeniedException("You are not authorized to access this appointment.");

            if (appointment.Status != AppointmentStatus.Confirmed)
                throw new BadRequestException("Only confirmed appointments can be marked as no-show.");

            if (appointment.AppointmentSlot.Status != SlotStatus.Booked)
                throw new BadRequestException("The appointment slot is not currently booked.");


            var payment = appointment.Payment;
            if (payment is null)
                throw new InternalServerErrorException("The payment associated with this appointment could not be found.");

            if (payment.Status != PaymentStatus.Paid)
                throw new BadRequestException("Only appointments with a completed payment can be marked as no-show.");


            var nowUtc = DateTime.UtcNow;
            var egyptTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
            var appointmentLocalEndDateTime = appointment.AppointmentSlot.Date.ToDateTime(appointment.AppointmentSlot.EndTime);
            var appointmentEndUtc = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(appointmentLocalEndDateTime, DateTimeKind.Unspecified), egyptTimeZone);
            if (nowUtc < appointmentEndUtc)
                throw new BadRequestException("The appointment cannot be marked as no-show before its scheduled end time.");

            if(appointment.Status == AppointmentStatus.NoShow)
                throw new BadRequestException("The appointment has already been marked as no-show.");

            appointment.Status = AppointmentStatus.NoShow;

            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException(
                    "We couldn't mark the appointment as no-show right now. Please try again later.");

            return "The appointment has been marked as no-show successfully.";
        }


        public async Task<string> SecretaryConfirmManualRefundAsync(string secretaryId, int appointmentId, ConfirmManualRefundRequest request)
        {
            if (string.IsNullOrWhiteSpace(secretaryId))
                throw new BadRequestException("We couldn't identify your account.");

            var secretary = await _unitOfWork.GetRepository<Secretary, string>().GetByIdAsync(secretaryId);
            if (secretary is null)
                throw new NotFoundException("We couldn't find your account.");

            if (secretary.ClinicId is null)
                throw new BadRequestException("You are not associated with any clinic.");


            var appointmentRepo = _unitOfWork.GetRepository<Appointment, int>();
            var appointmentSpec = AppointmentSpecifications.ByIdWithRefund(appointmentId);
            var appointment = await appointmentRepo.GetByIdAsync(appointmentSpec);
            if (appointment is null)
                throw new NotFoundException("The appointment was not found.");

            if (appointment.AppointmentSlot is null)
                throw new InternalServerErrorException("The appointment slot associated with this appointment could not be found.");

            if (secretary.ClinicId != appointment.AppointmentSlot.ClinicId)
                throw new ResourceAccessDeniedException("You are not authorized to access this appointment.");

            if (appointment.Status != AppointmentStatus.Cancelled)
                throw new BadRequestException("Only cancelled appointments can have their refunds confirmed.");

            if (appointment.Payment is null)
                throw new NotFoundException("The payment associated with this appointment could not be found.");

            if (appointment.Payment.Status != PaymentStatus.Paid)
                throw new BadRequestException("Only paid payments can have their refunds confirmed.");

            if (appointment.Payment.MethodType != PaymentMethodType.ManualTransfer && appointment.Payment.MethodType != PaymentMethodType.CashAtClinic)
                throw new BadRequestException("Manual refund confirmation is only available for manual transfers and cash payments.");


            if (appointment.Payment.Refund is null)
                throw new NotFoundException("No refund request was found for this payment.");

            if (appointment.Payment.Refund.Status != RefundStatus.PendingManualProcessing)
                throw new BadRequestException("This refund is not awaiting manual processing.");

            if (request.ManualRefundMethod == ManualRefundMethod.ManualTransfer && request.ManualRefundProof is null)
                throw new BadRequestException("A refund proof image is required for manual transfers.");


            string? uploadedFileName = null;
            try
            {
                uploadedFileName = request.ManualRefundProof is not null ? await FileStorageHandler.UploadAsync(request.ManualRefundProof, "manualrefundproofs") : null;
                appointment.Payment.Refund.ManualRefundProofUrl = uploadedFileName;
                appointment.Payment.Refund.ManualRefundTransactionReference = request.ManualRefundTransactionReference;
                appointment.Payment.Refund.Status = RefundStatus.Succeeded;
                appointment.Payment.Refund.ProcessedAt = DateTime.UtcNow;
                appointment.Payment.Refund.Method = request.ManualRefundMethod == ManualRefundMethod.ManualTransfer ? RefundMethod.ManualTransfer : RefundMethod.Cash;
                appointment.Payment.Status = PaymentStatus.Refunded;

                var result = await _unitOfWork.SaveChangesAsync();
                if (result == 0)
                    throw new InternalServerErrorException("You couldn't confirm the refund right now. Please try again later.");
            }
            catch (DbUpdateConcurrencyException)
            {
                if (uploadedFileName is not null)
                    FileStorageHandler.Delete(uploadedFileName, "manualrefundproofs");
                throw new BadRequestException("This refund was modified by another operation. Please refresh and check its current status.");
            }
            catch
            {
                if (uploadedFileName is not null)
                    FileStorageHandler.Delete(uploadedFileName, "manualrefundproofs");
                throw;
            }

            if (!string.IsNullOrWhiteSpace(appointment.PatientId))
            {
                await _notificationService.CreateAndSendAsync(
                    appointment.PatientId,
                    "Refund Confirmed",
                    $"Your refund for appointment #{appointment.Id} has been processed successfully.",
                    NotificationType.ManualRefundConfirmed);
            }

            return "The manual refund has been confirmed successfully.";
        }






        public async Task<GuestAppointmentReservationCheckout> SecretaryCreateGuestReservationAsync(string secretaryId, int appointmentSlotId, CreateGuestReservationRequest request)
        {
            if (string.IsNullOrWhiteSpace(secretaryId))
                throw new BadRequestException("We couldn't identify your account.");

            var secretary = await _unitOfWork.GetRepository<Secretary, string>().GetByIdAsync(secretaryId);

            if (secretary is null)
                throw new NotFoundException("We couldn't find your account.");

            if (secretary.ClinicId is null)
                throw new BadRequestException("You are not associated with any clinic.");


            var guestName = request.GuestPatientName.Trim();
            var guestPhone = request.GuestPatientPhone.Trim();

            var slot = await _unitOfWork.GetRepository<AppointmentSlot, int>().GetByIdAsync(appointmentSlotId);
            if (slot is null)
                throw new NotFoundException("The selected appointment slot was not found.");

            if (slot.ClinicId != secretary.ClinicId.Value)
                throw new ResourceAccessDeniedException("You are not authorized to this slot.");

            if (slot.Status != SlotStatus.Available)
                throw new BadRequestException("The selected appointment slot is no longer available.");


            var slotLocalDateTime = slot.Date.ToDateTime(slot.StartTime);


            var egyptTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
            var nowInEgypt = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, egyptTimeZone);

            if (slotLocalDateTime <= nowInEgypt)
                throw new BadRequestException("You cannot book a past appointment slot.");

            var doctorClinicAccess = await GetDoctorClinicAccessAsync(slot.DoctorId, slot.ClinicId);

            var clinic = doctorClinicAccess.Clinic;

            var consultationFee = clinic.ConsultationFee;
            var depositPercentage = clinic.DepositPercentage;

            if (consultationFee <= 0)
                throw new BadRequestException("The clinic consultation fee is not configured correctly.");

            if (depositPercentage <= 0 || depositPercentage > 100)
                throw new BadRequestException("The clinic deposit percentage is not configured correctly.");


            var depositAmount = request.BookingType switch
            {
                BookingType.Advance => Math.Round(consultationFee * depositPercentage / 100m,
                                                  2,
                                                  MidpointRounding.AwayFromZero),
                BookingType.WalkIn => consultationFee,
                _ => throw new BadRequestException("The selected booking type is invalid.")
            };

            var remainingAmount = consultationFee - depositAmount;

            var paymentAmount = depositAmount;

            if (paymentAmount <= 0 || remainingAmount < 0)
                throw new BadRequestException("The calculated reservation amounts are invalid.");

            var nowUtc = DateTime.UtcNow;
            var reservationExpiresAt = nowUtc.AddMinutes(30);

            var appointment = new Appointment
            {
                BookingDate = nowUtc,
                Status = AppointmentStatus.PendingPayment,
                BookingSource = BookingSource.Secretary,
                BookingType = request.BookingType,
                PatientId = null,
                GuestPatientName = guestName,
                GuestPatientPhone = guestPhone,
                AppointmentSlotId = slot.Id,
                ConsultationFee = consultationFee,
                DepositAmount = depositAmount,
                RemainingAmount = remainingAmount,
                ReservationExpiresAt = reservationExpiresAt,
                FullRefundCancellationWindowMinutes = _cancellationPolicy.FullRefundCancellationWindowMinutes,
                BookingCancellationGracePeriodMinutes = _cancellationPolicy.BookingCancellationGracePeriodMinutes
            };

            appointment.Payment = new Payment
            {
                CreatedAt = nowUtc,
                Amount = paymentAmount,
                Status = PaymentStatus.Pending,
                Appointment = appointment
            };

            slot.Status = SlotStatus.Reserved;

            await _unitOfWork.GetRepository<Appointment, int>().AddAsync(appointment);

            try
            {
                var result = await _unitOfWork.SaveChangesAsync();
                if (result == 0)
                    throw new InternalServerErrorException("We couldn't create the guest reservation. Please try again.");
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new BadRequestException("The selected slot was modified by another operation. Please refresh and try again.");
            }
            catch (DbUpdateException ex)
            when (ex.InnerException is SqlException sqlException && (sqlException.Number == 2601 || sqlException.Number == 2627))
            {
                throw new BadRequestException("The selected appointment slot is no longer available.");
            }

            return new GuestAppointmentReservationCheckout
            {
                AppointmentId = appointment.Id,
                GuestPatientName = guestName,
                GuestPatientPhone = guestPhone,
                BookingType = request.BookingType.ToString(),
                ConsultationFee = consultationFee,
                RemainingAmount = remainingAmount,
                PaymentAmount = paymentAmount,
                ReservationExpiresAt = reservationExpiresAt
            };
        }


        public async Task<string> SecretaryConfirmGuestReservationPaymentAsync(string secretaryId, int appointmentId, ConfirmGuestReservationPaymentRequest request)
        {
            if (string.IsNullOrWhiteSpace(secretaryId))
                throw new BadRequestException("We couldn't identify your account.");

            var secretary = await _unitOfWork.GetRepository<Secretary, string>().GetByIdAsync(secretaryId);

            if (secretary is null)
                throw new NotFoundException("We couldn't find your account.");

            if (secretary.ClinicId is null)
                throw new BadRequestException("You are not associated with any clinic.");

            var appointmentSpecification = AppointmentSpecifications.ById(appointmentId);
            var appointment = await _unitOfWork.GetRepository<Appointment, int>().GetByIdAsync(appointmentSpecification);

            if (appointment is null)
                throw new NotFoundException("The appointment was not found.");

            if (appointment.PatientId is not null || string.IsNullOrWhiteSpace(appointment.GuestPatientName))
                throw new BadRequestException("This operation is only available for guest appointments.");

            var slot = appointment.AppointmentSlot;
            var payment = appointment.Payment;

            if (slot is null || payment is null)
                throw new InternalServerErrorException("The appointment payment information is incomplete.");

            if (slot.ClinicId != secretary.ClinicId.Value)
                throw new ResourceAccessDeniedException("You are not authorized to confirm payment for this appointment.");

            if (appointment.Status != AppointmentStatus.PendingPayment || payment.Status != PaymentStatus.Pending)
                throw new BadRequestException("This reservation is no longer awaiting payment confirmation.");

            if (slot.Status != SlotStatus.Reserved)
                throw new BadRequestException("The appointment slot is no longer reserved for this appointment.");

            var nowUtc = DateTime.UtcNow;
            if (appointment.ReservationExpiresAt <= DateTime.UtcNow)
                throw new BadRequestException("This reservation has expired. Please create a new reservation.");


            switch (request.GuestReservationPaymentMethod)
            {
                case GuestReservationPaymentMethod.Cash:
                    if (request.ClinicManualPaymentMethodId.HasValue)
                        throw new BadRequestException("A manual payment method must not be provided for cash payments.");

                    payment.MethodType = PaymentMethodType.CashAtClinic;
                    payment.ClinicManualPaymentMethodId = null;
                    break;

                case GuestReservationPaymentMethod.ManualTransfer:
                    if (!request.ClinicManualPaymentMethodId.HasValue)
                        throw new BadRequestException("Please select a manual payment method.");

                    var paymentMethod = await _unitOfWork.GetRepository<ClinicManualPaymentMethod, int>().GetByIdAsync(request.ClinicManualPaymentMethodId.Value);

                    if (paymentMethod is null || paymentMethod.ClinicId != secretary.ClinicId.Value || !paymentMethod.IsActive)
                        throw new BadRequestException("The selected payment method is invalid or inactive.");

                    payment.MethodType = PaymentMethodType.ManualTransfer;
                    payment.ClinicManualPaymentMethodId = paymentMethod.Id;
                    break;

                default:
                    throw new BadRequestException("The selected payment method is invalid.");
            }

            payment.Status = PaymentStatus.Paid;
            payment.PaidAt = nowUtc;
            appointment.Status = AppointmentStatus.Confirmed;
            slot.Status = SlotStatus.Booked;

            try
            {
                var result = await _unitOfWork.SaveChangesAsync();
                if (result == 0)
                    throw new InternalServerErrorException("We couldn't confirm the payment. Please try again.");
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new BadRequestException("This reservation was modified by another operation. Refresh and check its status.");
            }

            return "Guest reservation payment confirmed successfully.";
        }


        public async Task<string> SecretaryCancelPendingGuestReservationBeforePaymentAsync(string secretaryId, int appointmentId)
        {
            if (string.IsNullOrWhiteSpace(secretaryId))
                throw new BadRequestException("We couldn't identify your account.");

            var secretary = await _unitOfWork.GetRepository<Secretary, string>().GetByIdAsync(secretaryId);

            if (secretary is null)
                throw new NotFoundException("We couldn't find your account.");

            if (secretary.ClinicId is null)
                throw new BadRequestException("You are not associated with any clinic.");

            var specification = AppointmentSpecifications.ById(appointmentId);
            var appointment = await _unitOfWork.GetRepository<Appointment, int>().GetByIdAsync(specification);
            if (appointment is null)
                throw new NotFoundException("The appointment was not found.");

            if (appointment.PatientId is not null || string.IsNullOrWhiteSpace(appointment.GuestPatientName))
                throw new BadRequestException("This operation is only available for guest reservations.");

            var slot = appointment.AppointmentSlot;
            var payment = appointment.Payment;

            if (slot is null || payment is null)
                throw new InternalServerErrorException("The appointment information is incomplete.");

            if (slot.ClinicId != secretary.ClinicId.Value)
                throw new ResourceAccessDeniedException("You are not authorized to cancel this reservation.");

            if (appointment.Status != AppointmentStatus.PendingPayment || payment.Status != PaymentStatus.Pending)
                throw new BadRequestException("This reservation is no longer awaiting payment and cannot be cancelled through this operation.");

            if (slot.Status != SlotStatus.Reserved)
                throw new BadRequestException("The slot is no longer reserved for this appointment.");

            var nowUtc = DateTime.UtcNow;
            if (appointment.ReservationExpiresAt <= DateTime.UtcNow)
                throw new BadRequestException("This reservation has expired. Please refresh and try again.");


            appointment.Status = AppointmentStatus.Cancelled;
            payment.Status = PaymentStatus.Cancelled;
            slot.Status = SlotStatus.Available;

            try
            {
                var result = await _unitOfWork.SaveChangesAsync();
                if (result == 0)
                    throw new InternalServerErrorException("You couldn't cancel the guest reservation. Please try again.");
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new BadRequestException("This reservation was modified by another operation. Please refresh and check its status.");
            }

            return "Guest reservation cancelled successfully.";
        }



        public async Task<string> RescheduleAppointmentByPatientAsync(string userId, int appointmentId, RescheduleAppointmentRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var patient = await _unitOfWork.GetRepository<Patient, string>().GetByIdAsync(userId);

            if (patient is null)
                throw new NotFoundException("We couldn't find your account.");

            var appointmentRepo = _unitOfWork.GetRepository<Appointment, int>();
            var appointmentSpec = AppointmentSpecifications.ById(appointmentId);
            var appointment = await appointmentRepo.GetByIdAsync(appointmentSpec);

            if (appointment is null)
                throw new NotFoundException("The appointment was not found.");

            if (appointment.PatientId != userId)
                throw new ResourceAccessDeniedException("You are not authorized to reschedule this appointment.");

            var result = await RescheduleAppointmentCoreAsync(appointment, request.NewAppointmentSlotId);


            var secretarySpec = SecretarySpecifications.GetSecretariesByClinicId(appointment.AppointmentSlot.ClinicId);
            var secretaries = await _unitOfWork.GetRepository<Secretary, string>().GetAllAsync(secretarySpec);

            foreach (var secretary in secretaries)
            {
                await _notificationService.CreateAndSendAsync(
                    secretary.Id,
                    "Appointment Rescheduled",
                    $"The patient has rescheduled appointment #{appointment.Id}. Please review the updated appointment details.",
                    NotificationType.AppointmentRescheduledByPatient);
            }

            return result;
        }

        public async Task<string> RescheduleAppointmentBySecretaryAsync(string userId, int appointmentId, RescheduleAppointmentRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var secretary = await _unitOfWork.GetRepository<Secretary, string>().GetByIdAsync(userId);

            if (secretary is null)
                throw new NotFoundException("We couldn't find your account.");

            if (secretary.ClinicId is null)
                throw new BadRequestException("You are not associated with any clinic.");
            int clinicId = secretary.ClinicId.Value;

            var appointmentRepo = _unitOfWork.GetRepository<Appointment, int>();
            var appointmentSpec = AppointmentSpecifications.ById(appointmentId);
            var appointment = await appointmentRepo.GetByIdAsync(appointmentSpec);

            if (appointment is null)
                throw new NotFoundException("The appointment was not found.");

            if (appointment.AppointmentSlot is null)
                throw new InternalServerErrorException(
                    "The appointment slot associated with this appointment could not be found.");

            if (appointment.AppointmentSlot.ClinicId != clinicId)
                throw new ResourceAccessDeniedException("You are not authorized to reschedule appointments outside your clinic.");

            var result = await RescheduleAppointmentCoreAsync(appointment, request.NewAppointmentSlotId);


            if (!string.IsNullOrWhiteSpace(appointment.PatientId))
            {
                await _notificationService.CreateAndSendAsync(
                    appointment.PatientId,
                    "Appointment Rescheduled",
                    $"Your appointment #{appointment.Id} has been rescheduled by the clinic. Please check your updated appointment details.",
                    NotificationType.AppointmentRescheduledBySecretary);
            }

            return result;
        }

        private async Task<string> RescheduleAppointmentCoreAsync(Appointment appointment, int newAppointmentSlotId)
        {
            var payment = appointment.Payment;
            var currentSlot = appointment.AppointmentSlot;

            if (currentSlot is null)
                throw new InternalServerErrorException("The current appointment slot could not be found.");

            if (payment is null)
                throw new InternalServerErrorException("The payment associated with this appointment could not be found.");

            if (appointment.Status == AppointmentStatus.PendingPayment)
            {
                if (payment.Status != PaymentStatus.Pending)
                    throw new BadRequestException("Only appointments with pending payment can be rescheduled before confirmation.");

                if (appointment.ReservationExpiresAt <= DateTime.UtcNow)
                    throw new BadRequestException("This reservation has expired. Please book another available slot.");

                if (currentSlot.Status != SlotStatus.Reserved)
                    throw new BadRequestException("The current appointment slot is no longer reserved.");
            }
            else if (appointment.Status == AppointmentStatus.Confirmed)
            {
                if (payment.Status != PaymentStatus.Paid)
                    throw new BadRequestException("Only confirmed appointments with completed payment can be rescheduled.");

                if (currentSlot.Status != SlotStatus.Booked)
                    throw new BadRequestException("The current appointment slot is not booked.");
            }
            else
                throw new BadRequestException("This appointment cannot be rescheduled at its current status.");


            if (newAppointmentSlotId == currentSlot.Id)
                throw new BadRequestException("The selected slot is already assigned to this appointment.");

            var slotRepo = _unitOfWork.GetRepository<AppointmentSlot, int>();
            var newSlot = await slotRepo.GetByIdAsync(newAppointmentSlotId);

            if (newSlot is null)
                throw new NotFoundException("The selected appointment slot was not found.");

            if (newSlot.Status != SlotStatus.Available)
                throw new BadRequestException("The selected appointment slot is no longer available.");

            if (newSlot.DoctorId != currentSlot.DoctorId || newSlot.ClinicId != currentSlot.ClinicId)
                throw new BadRequestException("The new appointment slot must belong to the same doctor and clinic.");


            var egyptTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
            var newSlotLocalDateTime = newSlot.Date.ToDateTime(newSlot.StartTime);
            var nowInEgypt = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, egyptTimeZone);

            if (newSlotLocalDateTime <= nowInEgypt)
                throw new BadRequestException("You cannot reschedule an appointment to a past time slot.");

            newSlot.Status = currentSlot.Status;
            currentSlot.Status = SlotStatus.Available;

            appointment.AppointmentSlotId = newSlot.Id;
            appointment.AppointmentSlot = newSlot;

            try
            {
                var result = await _unitOfWork.SaveChangesAsync();
                if (result == 0)
                    throw new InternalServerErrorException("We couldn't reschedule the appointment. Please try again later.");
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new BadRequestException("The appointment or selected slot was modified by another operation. Please refresh and try again.");
            }
            catch (DbUpdateException ex)
            when (ex.InnerException is SqlException sqlException && (sqlException.Number == 2601 || sqlException.Number == 2627))
            {
                throw new BadRequestException("The selected appointment slot is no longer available.");
            }

            return appointment.Status == AppointmentStatus.PendingPayment
                ? "Your appointment has been rescheduled successfully. Please complete the payment before your reservation expires."
                : "Your appointment has been rescheduled successfully.";
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
