using AutoMapper;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
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
        public AppointmentProfile()
        {
            CreateMap<Appointment, PatientAppointmentResponse>()
                .ForMember(dest => dest.AppointmentId, options => options.MapFrom(src => src.Id))
                .ForMember(dest => dest.DoctorName, options => options.MapFrom(src => $"{src.AppointmentSlot.Doctor.FirstName} {src.AppointmentSlot.Doctor.LastName}"))
                .ForMember(dest => dest.ClinicName, options => options.MapFrom(src => src.AppointmentSlot.Clinic.Name))
                .ForMember(dest => dest.AppointmentStatus, options => options.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.AppointmentSlotDate, options => options.MapFrom(src => src.AppointmentSlot.Date))
                .ForMember(dest => dest.StartTime, options => options.MapFrom(src => src.AppointmentSlot.StartTime))
                .ForMember(dest => dest.EndTime, options => options.MapFrom(src => src.AppointmentSlot.EndTime))
                .ForMember(dest => dest.PaymentStatus, options => options.MapFrom(src => src.Payment.Status.ToString()))
                .ForMember(dest => dest.ReservationExpiresAt, options => options.MapFrom(src => src.ReservationExpiresAt));


            CreateMap<Appointment, PatientAppointmentDetailsResponse>()
                .ForMember(dest => dest.AppointmentId, options => options.MapFrom(src => src.Id))
                .ForMember(dest => dest.DoctorId, options => options.MapFrom(src => src.AppointmentSlot.DoctorId))
                .ForMember(dest => dest.DoctorName, options => options.MapFrom(src => $"{src.AppointmentSlot.Doctor.FirstName} {src.AppointmentSlot.Doctor.LastName}"))
                .ForMember(dest => dest.ClinicId, options => options.MapFrom(src => src.AppointmentSlot.ClinicId))
                .ForMember(dest => dest.ClinicName, options => options.MapFrom(src => src.AppointmentSlot.Clinic.Name))
                .ForMember(dest => dest.BookingDate, options => options.MapFrom(src => src.BookingDate))
                .ForMember(dest => dest.AppointmentStatus, options => options.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.AppointmentSlotDate, options => options.MapFrom(src => src.AppointmentSlot.Date))
                .ForMember(dest => dest.StartTime, options => options.MapFrom(src => src.AppointmentSlot.StartTime))
                .ForMember(dest => dest.EndTime, options => options.MapFrom(src => src.AppointmentSlot.EndTime))
                .ForMember(dest => dest.PaymentStatus, options => options.MapFrom(src => src.Payment.Status.ToString()))
                .ForMember(dest => dest.PatientNotes, options => options.MapFrom(src => src.PatientNotes))
                .ForMember(dest => dest.ConsultationFee, options => options.MapFrom(src => src.ConsultationFee))
                .ForMember(dest => dest.DepositAmount, options => options.MapFrom(src => src.DepositAmount))
                .ForMember(dest => dest.RemainingAmount, options => options.MapFrom(src => src.RemainingAmount))
                .ForMember(dest => dest.ReservationExpiresAt, options => options.MapFrom(src => src.ReservationExpiresAt))
                .ForMember(dest => dest.FullRefundCancellationWindowMinutes, options => options.MapFrom(src => src.FullRefundCancellationWindowMinutes))
                .ForMember(dest => dest.BookingCancellationGracePeriodMinutes, options => options.MapFrom(src => src.BookingCancellationGracePeriodMinutes));
        }


    }
}
