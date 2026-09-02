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
            CreateMap<Invitation, SentInvitationsResponse>()
                .ForMember(D => D.ReceiverDoctorName, config => config.MapFrom(S => $"Dr. {S.DoctorReceiver.FirstName} {S.DoctorReceiver.LastName}"))
                .ForMember(D => D.ClinicName, config => config.MapFrom(S => S.Clinic.Name))
                .ForMember(D => D.InvitationStatusName, config => config.MapFrom(S => S.Status.ToString()))
                .ForMember(D => D.RespondedAt, config => config.MapFrom(S => S.RespondedAt ?? DateTime.MinValue));

            CreateMap<Invitation, ReceivedInvitationsResponse>()
                .ForMember(D => D.SenderDoctorName, config => config.MapFrom(S => $"Dr. {S.DoctorSender.FirstName} {S.DoctorSender.LastName}"))
                .ForMember(D => D.ClinicName, config => config.MapFrom(S => S.Clinic.Name))
                .ForMember(D => D.InvitationStatusName, config => config.MapFrom(S => S.Status.ToString()))
                .ForMember(D => D.RespondedAt, config => config.MapFrom(S => S.RespondedAt ?? DateTime.MinValue));
        }
    }
}
