using AutoMapper;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Microsoft.Extensions.Configuration;
using Shared.Dtos.Appointments;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.AutoMapping.Appointments
{
    public class AppointmentProfile : Profile
    {
        public AppointmentProfile(IConfiguration _configuration)
        {
            // =========================================
            // Patient Appointments List
            // =========================================

            CreateMap<Appointment, PatientAppointmentResponse>()
                .ForMember(dest => dest.AppointmentId, options => options.MapFrom(src => src.Id))
                .ForMember(dest => dest.DoctorName, options => options.MapFrom(src => $"Dr. {src.AppointmentSlot.Doctor.FirstName} {src.AppointmentSlot.Doctor.LastName}"))
                .ForMember(dest => dest.ClinicName, options => options.MapFrom(src => src.AppointmentSlot.Clinic.Name))
                .ForMember(dest => dest.SlotDate, options => options.MapFrom(src => src.AppointmentSlot.Date))
                .ForMember(dest => dest.SlotStartTime, options => options.MapFrom(src => src.AppointmentSlot.StartTime))
                .ForMember(dest => dest.SlotEndTime, options => options.MapFrom(src => src.AppointmentSlot.EndTime))
                .ForMember(dest => dest.AppointmentStatus, options => options.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.DepositPaymentStatus, options => options.MapFrom(src => src.DepositPayment.Status.ToString()))
                .ForMember(dest => dest.DepositAmount, options => options.MapFrom(src => src.DepositPayment.RequiredAmount))
                .ForMember(dest => dest.DepositRefundStatus, options => options.MapFrom(src => src.DepositPayment.DepositRefund != null ? src.DepositPayment.DepositRefund.Status.ToString() : null))
                .ForMember(dest => dest.RequestedDepositRefundAmount, options => options.MapFrom(src => src.DepositPayment.DepositRefund != null ? src.DepositPayment.DepositRefund.RequestedRefundAmount : (decimal?)null))
                .ForMember(dest => dest.ReservationExpiresAt, options => options.MapFrom(src => src.ReservationExpiresAt));


            // =========================================
            // Patient Appointment Details
            // =========================================

            CreateMap<Appointment, PatientAppointmentDetailsResponse>()
                .ForMember(dest => dest.AppointmentId, options => options.MapFrom(src => src.Id))
                .ForMember(dest => dest.DoctorName, options => options.MapFrom(src => $"Dr. {src.AppointmentSlot.Doctor.FirstName} {src.AppointmentSlot.Doctor.LastName}"))
                .ForMember(dest => dest.ClinicName, options => options.MapFrom(src => src.AppointmentSlot.Clinic.Name))
                .ForMember(dest => dest.BookingDate, options => options.MapFrom(src => src.BookingDate))
                .ForMember(dest => dest.BookingSource, options => options.MapFrom(src => src.BookingSource.ToString()))
                .ForMember(dest => dest.BookingType, options => options.MapFrom(src => src.BookingType.ToString()))
                .ForMember(dest => dest.SlotDate, options => options.MapFrom(src => src.AppointmentSlot.Date))
                .ForMember(dest => dest.SlotStartTime, options => options.MapFrom(src => src.AppointmentSlot.StartTime))
                .ForMember(dest => dest.SlotEndTime, options => options.MapFrom(src => src.AppointmentSlot.EndTime))
                .ForMember(dest => dest.AppointmentStatus, options => options.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.ReservationExpiresAt, options => options.MapFrom(src => src.ReservationExpiresAt))
                .ForMember(dest => dest.ConsultationFee, options => options.MapFrom(src => src.ConsultationFee))
                .ForMember(dest => dest.TotalPaidAmount, options => options.MapFrom(src => src.TotalPaidAmount))
                .ForMember(dest => dest.DepositAmount, options => options.MapFrom(src => src.DepositPayment.RequiredAmount))
                .ForMember(dest => dest.DepositPaymentStatus, options => options.MapFrom(src => src.DepositPayment.Status.ToString()))
                .ForMember(dest => dest.DepositPaymentMethodType, options => options.MapFrom(src => src.DepositPayment.MethodType.HasValue ? src.DepositPayment.MethodType.Value.ToString() : null))
                .ForMember(dest => dest.DepositClinicManualPaymentMethodType, options => options.MapFrom(src => src.DepositPayment.ClinicManualPaymentMethod != null ? src.DepositPayment.ClinicManualPaymentMethod.Type.ToString() : null))
                .ForMember(dest => dest.ManualDepositPaymentProofUrl, options => options.MapFrom(new ManualDepositPaymentProofUrlResolver<PatientAppointmentDetailsResponse>(_configuration)))
                .ForMember(dest => dest.DepositPaymentTransactionReference, options => options.MapFrom(src => src.DepositPayment.TransactionReference))
                .ForMember(dest => dest.DepositPaymentRejectionReason, options => options.MapFrom(src => src.DepositPayment.SecretaryRejectionReason))
                .ForMember(dest => dest.RemainingAmount, options => options.MapFrom(src => src.RemainingPayment != null ? src.RemainingPayment.RequiredAmount : 0m))
                .ForMember(dest => dest.RemainingPaymentStatus, options => options.MapFrom(src => src.RemainingPayment != null ? src.RemainingPayment.Status.ToString() : null))
                .ForMember(dest => dest.RemainingPaymentMethodType, options => options.MapFrom(src => src.RemainingPayment != null && src.RemainingPayment.MethodType.HasValue ? src.RemainingPayment.MethodType.Value.ToString() : null))
                .ForMember(dest => dest.RemainingClinicManualPaymentMethodType, options => options.MapFrom(src => src.RemainingPayment != null && src.RemainingPayment.ClinicManualPaymentMethod != null ? src.RemainingPayment.ClinicManualPaymentMethod.Type.ToString() : null))
                .ForMember(dest => dest.RequestedDepositRefundAmount, options => options.MapFrom(src => src.DepositPayment.DepositRefund != null ? src.DepositPayment.DepositRefund.RequestedRefundAmount : (decimal?)null))
                .ForMember(dest => dest.DepositRefundStatus, options => options.MapFrom(src => src.DepositPayment.DepositRefund != null ? src.DepositPayment.DepositRefund.Status.ToString() : null))
                .ForMember(dest => dest.DepositRefundMethodType, options => options.MapFrom(src => src.DepositPayment.DepositRefund != null && src.DepositPayment.DepositRefund.MethodType.HasValue ? src.DepositPayment.DepositRefund.MethodType.Value.ToString() : null))
                .ForMember(dest => dest.DepositRefundReason, options => options.MapFrom(src => src.DepositPayment.DepositRefund != null ? src.DepositPayment.DepositRefund.Reason.ToString() : null))
                .ForMember(dest => dest.DepositRefundRequestedAt, options => options.MapFrom(src => src.DepositPayment.DepositRefund != null ? src.DepositPayment.DepositRefund.RequestedAt : (DateTime?)null))
                .ForMember(dest => dest.DepositRefundProcessedAt, options => options.MapFrom(src => src.DepositPayment.DepositRefund != null ? src.DepositPayment.DepositRefund.ProcessedAt : (DateTime?)null))
                .ForMember(dest => dest.ManualDepositRefundProofUrl, options => options.MapFrom(new ManualDepositRefundProofUrlResolver<PatientAppointmentDetailsResponse>(_configuration)))
                .ForMember(dest => dest.ManualDepositRefundTransactionReference, options => options.MapFrom(src => src.DepositPayment.DepositRefund != null ? src.DepositPayment.DepositRefund.ManualTransactionReference : null))
                .ForMember(dest => dest.FullRefundCancellationWindowMinutes, options => options.MapFrom(src => src.FullRefundCancellationWindowMinutes))
                .ForMember(dest => dest.BookingCancellationGracePeriodMinutes, options => options.MapFrom(src => src.BookingCancellationGracePeriodMinutes));



            // =========================================
            // Secretary Appointments List
            // =========================================

            CreateMap<Appointment, SecretaryAppointmentResponse>()
                .ForMember(dest => dest.AppointmentId, options => options.MapFrom(src => src.Id))
                .ForMember(dest => dest.SlotDate, options => options.MapFrom(src => src.AppointmentSlot.Date))
                .ForMember(dest => dest.SlotStartTime, options => options.MapFrom(src => src.AppointmentSlot.StartTime))
                .ForMember(dest => dest.SlotEndTime, options => options.MapFrom(src => src.AppointmentSlot.EndTime))
                .ForMember(dest => dest.AppointmentStatus, options => options.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.DoctorName, options => options.MapFrom(src => $"Dr. {src.AppointmentSlot.Doctor.FirstName} {src.AppointmentSlot.Doctor.LastName}"))
                .ForMember(dest => dest.PatientName, options => options.MapFrom(src => src.Patient != null ? $"{src.Patient.FirstName} {src.Patient.LastName}" : src.GuestPatientName))
                .ForMember(dest => dest.DepositPaymentStatus, options => options.MapFrom(src => src.DepositPayment.Status.ToString()))
                .ForMember(dest => dest.DepositPaymentMethodType, options => options.MapFrom(src => src.DepositPayment.MethodType.HasValue ? src.DepositPayment.MethodType.Value.ToString() : null))
                .ForMember(dest => dest.RequiresManualRefundAction, options => options.MapFrom(src => src.DepositPayment.DepositRefund != null ? src.DepositPayment.DepositRefund.Status == DepositRefundStatus.PendingManualProcessing : false));


            // =========================================
            // Secretary Appointment Details
            // =========================================

            CreateMap<Appointment, SecretaryAppointmentDetailsResponse>()
                .ForMember(dest => dest.AppointmentId, options => options.MapFrom(src => src.Id))
                .ForMember(dest => dest.SlotDate, options => options.MapFrom(src => src.AppointmentSlot.Date))
                .ForMember(dest => dest.SlotStartTime, options => options.MapFrom(src => src.AppointmentSlot.StartTime))
                .ForMember(dest => dest.SlotEndTime, options => options.MapFrom(src => src.AppointmentSlot.EndTime))
                .ForMember(dest => dest.AppointmentStatus, options => options.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.BookingSource, options => options.MapFrom(src => src.BookingSource.ToString()))
                .ForMember(dest => dest.BookingType, options => options.MapFrom(src => src.BookingType.ToString()))
                .ForMember(dest => dest.DoctorName, options => options.MapFrom(src => $"Dr. {src.AppointmentSlot.Doctor.FirstName} {src.AppointmentSlot.Doctor.LastName}"))
                .ForMember(dest => dest.PatientName, options => options.MapFrom(src => src.Patient != null ? $"{src.Patient.FirstName} {src.Patient.LastName}" : src.GuestPatientName))
                .ForMember(dest => dest.PatientPhoneNumber, options => options.MapFrom(src => src.Patient != null ? src.Patient.PhoneNumber : src.GuestPatientPhone))
                .ForMember(dest => dest.DepositPaymentAmount, options => options.MapFrom(src => src.DepositPayment.RequiredAmount))
                .ForMember(dest => dest.DepositPaymentStatus, options => options.MapFrom(src => src.DepositPayment.Status.ToString()))
                .ForMember(dest => dest.DepositPaymentMethodType, options => options.MapFrom(src => src.DepositPayment.MethodType.HasValue ? src.DepositPayment.MethodType.Value.ToString() : null))
                .ForMember(dest => dest.DepositClinicManualPaymentMethodType, options => options.MapFrom(src => src.DepositPayment.ClinicManualPaymentMethod != null ? src.DepositPayment.ClinicManualPaymentMethod.Type.ToString() : null))
                .ForMember(dest => dest.DepositPaymentSecretaryRejectionReason, options => options.MapFrom(src => src.DepositPayment.SecretaryRejectionReason))
                .ForMember(dest => dest.TotalPaidAmount, options => options.MapFrom(src => src.TotalPaidAmount))
                .ForMember(dest => dest.RemainingPaymentAmount, options => options.MapFrom(src => src.RemainingPayment != null ? src.RemainingPayment.RequiredAmount : 0m))
                .ForMember(dest => dest.ManualDepositPaymentProofUrl, options => options.MapFrom(new ManualDepositPaymentProofUrlResolver<SecretaryAppointmentDetailsResponse>(_configuration)))
                .ForMember(dest => dest.DepositPaymentTransactionReference, options => options.MapFrom(src => src.DepositPayment.TransactionReference))
                .ForMember(dest => dest.RemainingPaymentStatus, options => options.MapFrom(src => src.RemainingPayment != null ? src.RemainingPayment.Status.ToString() : null))
                .ForMember(dest => dest.RemainingPaymentMethodType, options => options.MapFrom(src => src.RemainingPayment != null && src.RemainingPayment.MethodType.HasValue ? src.RemainingPayment.MethodType.Value.ToString() : null))
                .ForMember(dest => dest.RemainingClinicManualPaymentMethodType, options => options.MapFrom(src => src.RemainingPayment != null && src.RemainingPayment.ClinicManualPaymentMethod != null ? src.RemainingPayment.ClinicManualPaymentMethod.Type.ToString() : null))
                .ForMember(dest => dest.RequestedDepositRefundAmount, options => options.MapFrom(src => src.DepositPayment.DepositRefund != null ? src.DepositPayment.DepositRefund.RequestedRefundAmount : (decimal?)null))
                .ForMember(dest => dest.DepositRefundStatus, options => options.MapFrom(src => src.DepositPayment.DepositRefund != null ? src.DepositPayment.DepositRefund.Status.ToString() : null))
                .ForMember(dest => dest.DepositRefundReason, options => options.MapFrom(src => src.DepositPayment.DepositRefund != null ? src.DepositPayment.DepositRefund.Reason.ToString() : null))
                .ForMember(dest => dest.DepositRefundMethodType, options => options.MapFrom(src => src.DepositPayment.DepositRefund != null ? src.DepositPayment.DepositRefund.MethodType.ToString() : null))
                .ForMember(dest => dest.DepositRefundProcessedAt, options => options.MapFrom(src => src.DepositPayment.DepositRefund != null ? src.DepositPayment.DepositRefund.ProcessedAt : null))
                .ForMember(dest => dest.ManualDepositRefundTransactionReference, options => options.MapFrom(src => src.DepositPayment.DepositRefund != null ? src.DepositPayment.DepositRefund.ManualTransactionReference : null))
                .ForMember(dest => dest.ManualDepositRefundProofUrl, options => options.MapFrom(new ManualDepositRefundProofUrlResolver<SecretaryAppointmentDetailsResponse>(_configuration)));
        }
    }
}
