using AutoMapper;
using Domain.Entities.BusinessEntities;
using Shared.Dtos.DoctorInvitations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.AutoMapping.DoctorInvitations
{
    public class DoctorInvitationProfile : Profile
    {
        public DoctorInvitationProfile()
        {
            CreateMap<DoctorInvitation, SentDoctorInvitationResponse>()
                .ForMember(D => D.ReceiverName, config => config.MapFrom(S => $"Dr. {S.DoctorReceiver.FirstName} {S.DoctorReceiver.LastName}"))
                .ForMember(D => D.ClinicName, config => config.MapFrom(S => S.Clinic.Name))
                .ForMember(D => D.Status, config => config.MapFrom(S => S.Status.ToString()));

            CreateMap<DoctorInvitation, ReceivedDoctorInvitationResponse>()
                .ForMember(D => D.SenderName, config => config.MapFrom(S => $"Dr. {S.DoctorSender.FirstName} {S.DoctorSender.LastName}"))
                .ForMember(D => D.ClinicName, config => config.MapFrom(S => S.Clinic.Name))
                .ForMember(D => D.Status, config => config.MapFrom(S => S.Status.ToString()));
        }
    }
}
