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
using Services.Abstractions.Appointments;
using Services.Abstractions.AppointmentSlots;
using Services.Commen;
using Services.Specifications.Appointments;
using Services.Specifications.AppointmentSlots;
using Services.Specifications.ClinicManualPaymentMethods;
using Shared.Dtos.Appointments;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Appointments
{
    public class AppointmentService(IUnitOfWork _unitOfWork,
                                    IMapper _mapper) : IAppointmentService
    {
        public async Task<string> CreateAppointmentAsync(string userId, int appointmentSlotId, CreateAppointmentRequest request)
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
                ReservationExpiresAt = DateTime.UtcNow.AddMinutes(30)
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
                throw new ResourceAccessDeniedException("You are not authorized to cancel this appointment.");

            return _mapper.Map<PatientAppointmentDetailsResponse>(appointment);
        }



        public async Task<string> CancelAppointmentAsync(string userId, int appointmentId)
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

            // TODO: Replace with refund logic when refund support is implemented.
            if (appointment.Payment.Status == PaymentStatus.Paid)
                throw new BadRequestException("A paid appointment cannot be cancelled at this time.");


            appointment.Status = AppointmentStatus.Cancelled;
            appointment.Payment.Status = PaymentStatus.Cancelled;

            if (appointment.AppointmentSlot.Status == SlotStatus.Reserved)
                appointment.AppointmentSlot.Status = SlotStatus.Available;

            var result = await _unitOfWork.SaveChangesAsync();

            if (result == 0)
                throw new InternalServerErrorException("We couldn't cancel your appointment right now. Please try again later.");

            return "Your appointment has been cancelled successfully.";
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
