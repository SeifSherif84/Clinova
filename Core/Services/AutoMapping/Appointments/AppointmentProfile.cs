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
            CreateMap<Appointment, PatientAppointmentResponse>()
                .ForMember(dest => dest.AppointmentId, options => options.MapFrom(src => src.Id))
                .ForMember(dest => dest.DoctorName, options => options.MapFrom(src => $"{src.AppointmentSlot.Doctor.FirstName} {src.AppointmentSlot.Doctor.LastName}"))
                .ForMember(dest => dest.ClinicName, options => options.MapFrom(src => src.AppointmentSlot.Clinic.Name))
                .ForMember(dest => dest.AppointmentStatus, options => options.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.AppointmentSlotDate, options => options.MapFrom(src => src.AppointmentSlot.Date))
                .ForMember(dest => dest.StartTime, options => options.MapFrom(src => src.AppointmentSlot.StartTime))
                .ForMember(dest => dest.EndTime, options => options.MapFrom(src => src.AppointmentSlot.EndTime))
                .ForMember(dest => dest.PaymentStatus, options => options.MapFrom(src => src.Payment.Status.ToString()));



            CreateMap<Appointment, PatientAppointmentDetailsResponse>()
                .ForMember(dest => dest.AppointmentId, options => options.MapFrom(src => src.Id))
                .ForMember(dest => dest.DoctorId, options => options.MapFrom(src => src.AppointmentSlot.DoctorId))
                .ForMember(dest => dest.DoctorName, options => options.MapFrom(src => $"{src.AppointmentSlot.Doctor.FirstName} {src.AppointmentSlot.Doctor.LastName}"))
                .ForMember(dest => dest.ClinicId, options => options.MapFrom(src => src.AppointmentSlot.ClinicId))
                .ForMember(dest => dest.ClinicName, options => options.MapFrom(src => src.AppointmentSlot.Clinic.Name))
                .ForMember(dest => dest.AppointmentStatus, options => options.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.AppointmentSlotDate, options => options.MapFrom(src => src.AppointmentSlot.Date))
                .ForMember(dest => dest.StartTime, options => options.MapFrom(src => src.AppointmentSlot.StartTime))
                .ForMember(dest => dest.EndTime, options => options.MapFrom(src => src.AppointmentSlot.EndTime))
                .ForMember(dest => dest.PaymentStatus, options => options.MapFrom(src => src.Payment.Status.ToString()));




            CreateMap<Appointment, SecretaryAppointmentResponse>()
                .ForMember(dest => dest.AppointmentId, options => options.MapFrom(src => src.Id))
                .ForMember(dest => dest.SlotDate, options => options.MapFrom(src => src.AppointmentSlot.Date))
                .ForMember(dest => dest.SlotStartTime, options => options.MapFrom(src => src.AppointmentSlot.StartTime))
                .ForMember(dest => dest.SlotEndTime, options => options.MapFrom(src => src.AppointmentSlot.EndTime))
                .ForMember(dest => dest.AppointmentStatus, options => options.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.DoctorName, options => options.MapFrom(src => $"{src.AppointmentSlot.Doctor.FirstName} {src.AppointmentSlot.Doctor.LastName}"))
                .ForMember(dest => dest.PatientName, options => options.MapFrom(src => src.Patient != null ? $"{src.Patient.FirstName} {src.Patient.LastName}" : src.GuestPatientName))
                .ForMember(dest => dest.PaymentStatus, options => options.MapFrom(src => src.Payment.Status.ToString()))
                .ForMember(dest => dest.PaymentCategory, options => options.MapFrom(src => src.Payment.MethodType == PaymentMethodType.Paymob ? PaymentType.Online.ToString() : PaymentType.Manual.ToString()))
                .ForMember(dest => dest.RequiresManualRefundAction, options => options.MapFrom(src => src.Payment.Refund != null ? src.Payment.Refund.Status == RefundStatus.PendingManualProcessing : false));



            CreateMap<Appointment, SecretaryAppointmentDetailsResponse>()
                .ForMember(dest => dest.AppointmentId, options => options.MapFrom(src => src.Id))
                .ForMember(dest => dest.SlotDate, options => options.MapFrom(src => src.AppointmentSlot.Date))
                .ForMember(dest => dest.SlotStartTime, options => options.MapFrom(src => src.AppointmentSlot.StartTime))
                .ForMember(dest => dest.SlotEndTime, options => options.MapFrom(src => src.AppointmentSlot.EndTime))
                .ForMember(dest => dest.AppointmentStatus, options => options.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.BookingSource, options => options.MapFrom(src => src.BookingSource.ToString()))
                .ForMember(dest => dest.BookingType, options => options.MapFrom(src => src.BookingType.ToString()))
                .ForMember(dest => dest.DoctorName, options => options.MapFrom(src => $"{src.AppointmentSlot.Doctor.FirstName} {src.AppointmentSlot.Doctor.LastName}"))
                .ForMember(dest => dest.PatientName, options => options.MapFrom(src => src.Patient != null ? $"{src.Patient.FirstName} {src.Patient.LastName}" : src.GuestPatientName))
                .ForMember(dest => dest.PatientPhoneNumber, options => options.MapFrom(src => src.Patient != null ? src.Patient.PhoneNumber : src.GuestPatientPhone))
                .ForMember(dest => dest.PaymentStatus, options => options.MapFrom(src => src.Payment.Status.ToString()))
                .ForMember(dest => dest.PaymentCategory, options => options.MapFrom(src => src.Payment.MethodType == PaymentMethodType.Paymob ? PaymentType.Online.ToString() : PaymentType.Manual.ToString()))
                .ForMember(dest => dest.PaymentMethodType, options => options.MapFrom(src => src.Payment.MethodType.HasValue ? src.Payment.MethodType.Value.ToString() : null))
                .ForMember(dest => dest.ClinicManualPaymentMethodType, options => options.MapFrom(src => src.Payment.ClinicManualPaymentMethod != null ? src.Payment.ClinicManualPaymentMethod.Type.ToString() : null))
                .ForMember(dest => dest.PaymentSecretaryRejectionReason, options => options.MapFrom(src => src.Payment.SecretaryRejectionReason))
                .ForMember(dest => dest.PaymentAmount, options => options.MapFrom(src => src.Payment.Amount))
                .ForMember(dest => dest.RemainingAmount, options => options.MapFrom(src => src.RemainingAmount))
                .ForMember(dest => dest.ManualPaymentProofUrl, options => options.MapFrom(new ManualPaymentProofUrlResolver(_configuration)))
                .ForMember(dest => dest.PaymentTransactionReference, options => options.MapFrom(src => src.Payment.TransactionReference))
                .ForMember(dest => dest.RefundStatus, options => options.MapFrom(src => src.Payment.Refund != null ? src.Payment.Refund.Status.ToString() : null))
                .ForMember(dest => dest.RefundAmount, options => options.MapFrom(src => src.Payment.Refund != null ? src.Payment.Refund.Amount : (decimal?)null))
                .ForMember(dest => dest.RefundReason, options => options.MapFrom(src => src.Payment.Refund != null ? src.Payment.Refund.Reason.ToString() : null))
                .ForMember(dest => dest.RefundProcessedAt, options => options.MapFrom(src => src.Payment.Refund != null && src.Payment.Refund.ProcessedAt.HasValue ? src.Payment.Refund.ProcessedAt.Value.ToString("yyyy-MM-dd HH:mm:ss") : null))
                .ForMember(dest => dest.ManualRefundTransactionReference, options => options.MapFrom(src => src.Payment.Refund != null ? src.Payment.Refund.ManualRefundTransactionReference : null))
                .ForMember(dest => dest.ManualRefundProofUrl, options => options.MapFrom(new ManualRefundProofUrlResolver(_configuration)));

        }


    }
}
