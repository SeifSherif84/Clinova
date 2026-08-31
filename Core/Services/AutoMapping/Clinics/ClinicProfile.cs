using AutoMapper;
using Domain.Entities.BusinessEntities;
using Microsoft.Extensions.Configuration;
using Shared.Dtos.Clinics;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.AutoMapping.Clinics
{
    public class ClinicProfile : Profile
    {
        public ClinicProfile(IConfiguration _configuration)
        {
            CreateMap<AddClinicRequest, Clinic>()
                .ForMember(D => D.Images, config => config.Ignore())
                .ForMember(D => D.PhoneNumbers, config => config.Ignore());

            CreateMap<UpdateClinicRequest, Clinic>()
                .ForMember(D => D.RegionId, config => config.Ignore())
                .ForAllMembers(config => config.Condition((S, D, srcMember) => srcMember != null));

            CreateMap<Clinic, ClinicResponse>()
                .ForMember(D => D.RegionName, config => config.MapFrom(S => S.Region.Name));

            CreateMap<Clinic, ClinicDetailsResponse>()
                .ForMember(D => D.RegionName, config => config.MapFrom(S => S.Region.Name))
                .ForMember(D => D.Images, config => config.MapFrom(new ClinicImagesUrlResolver(_configuration)))
                .ForMember(D => D.PhoneNumbers, config => config.MapFrom(S => S.PhoneNumbers.Select(item => item.PhoneNumber)));
        }
    }
}
