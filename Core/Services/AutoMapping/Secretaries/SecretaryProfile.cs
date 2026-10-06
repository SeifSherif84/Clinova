using AutoMapper;
using Domain.Entities.BusinessEntities;
using Microsoft.Extensions.Configuration;
using Services.AutoMapping.Doctors;
using Shared.Dtos.Clinics;
using Shared.Dtos.Patients;
using Shared.Dtos.Secretaries;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.AutoMapping.Secretaries
{
    public class SecretaryProfile : Profile
    {
        public SecretaryProfile(IConfiguration _configuration)
        {
            CreateMap<Secretary, SecretaryProfileResponse>()
                .ForMember(dest => dest.ProfilePicture, config => config.MapFrom(new ProfilePictureUrlResolver<SecretaryProfileResponse>(_configuration)))
                .ForMember(dest => dest.NationalIdImageUrl, config => config.MapFrom(new NationalIdImageUrlResolver(_configuration)));

            CreateMap<UpdateSecretaryProfileRequest, Secretary>()
                .ForAllMembers(config => config.Condition((S, D, srcMember) => srcMember != null));

            CreateMap<Secretary, ClinicSecretaryResponse>()
                .ForMember(dest => dest.FullName, config => config.MapFrom(src => $"{src.FirstName} {src.LastName}"))
                .ForMember(dest => dest.ProfilePicture, config => config.MapFrom(new ProfilePictureUrlResolver<ClinicSecretaryResponse>(_configuration)));
        }
    }
}
