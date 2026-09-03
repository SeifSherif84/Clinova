using AutoMapper;
using Domain.Entities.BusinessEntities;
using Shared.Dtos.Invitations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.AutoMapping.Invitations
{
    public class InvitationProfile : Profile
    {
        public InvitationProfile()
        {
            CreateMap<Invitation, SentInvitationResponse>()
                .ForMember(D => D.ReceiverName, config => config.MapFrom(S => $"Dr. {S.DoctorReceiver.FirstName} {S.DoctorReceiver.LastName}"))
                .ForMember(D => D.ClinicName, config => config.MapFrom(S => S.Clinic.Name))
                .ForMember(D => D.Status, config => config.MapFrom(S => S.Status.ToString()));

            CreateMap<Invitation, ReceivedInvitationResponse>()
                .ForMember(D => D.SenderName, config => config.MapFrom(S => $"Dr. {S.DoctorSender.FirstName} {S.DoctorSender.LastName}"))
                .ForMember(D => D.ClinicName, config => config.MapFrom(S => S.Clinic.Name))
                .ForMember(D => D.Status, config => config.MapFrom(S => S.Status.ToString()));
        }
    }
}
