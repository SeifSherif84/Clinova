using AutoMapper;
using Domain.Entities.BusinessEntities;
using Shared.Dtos.SecretaryInvitations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.AutoMapping.SecretaryInvitations
{
    public class SecretaryInvitationProfile : Profile
    {
        public SecretaryInvitationProfile()
        {
            CreateMap<SecretaryInvitation, SentSecretaryInvitationResponse>()
                .ForMember(dest => dest.ReceiverName, config => config.MapFrom(new SecretaryNameResolver()))
                .ForMember(dest => dest.ClinicName, config => config.MapFrom(src => src.Clinic.Name))
                .ForMember(dest => dest.Status, config => config.MapFrom(src => src.Status.ToString()));


            CreateMap<SecretaryInvitation, ReceivedSecretaryInvitationResponse>()
                .ForMember(dest => dest.SenderName, config => config.MapFrom(src => $"{src.DoctorSender.FirstName} {src.DoctorSender.LastName}"))
                .ForMember(dest => dest.ClinicName, config => config.MapFrom(src => src.Clinic.Name))
                .ForMember(dest => dest.Status, config => config.MapFrom(src => src.Status.ToString()));
        }
    }
}
