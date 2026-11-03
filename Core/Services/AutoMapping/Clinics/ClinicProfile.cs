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
                .ForMember(dest => dest.Images, config => config.Ignore())
                .ForMember(dest => dest.PhoneNumbers, config => config.Ignore());

            CreateMap<UpdateClinicRequest, Clinic>()
                .ForMember(dest => dest.RegionId, config => config.Ignore())
                .ForAllMembers(config => config.Condition((src, dest, srcMember) => srcMember != null));

            CreateMap<Clinic, ClinicResponse>()
                .ForMember(dest => dest.RegionName, config => config.MapFrom(src => src.Region.Name));

            CreateMap<Clinic, ClinicDetailsResponse>()
                .ForMember(dest => dest.RegionName, config => config.MapFrom(src => src.Region.Name))
                .ForMember(dest => dest.Images, config => config.MapFrom(new ClinicImagesUrlResolver(_configuration)))
                .ForMember(dest => dest.PhoneNumbers, config => config.MapFrom(src => src.PhoneNumbers.Select(item => new ClinicPhoneNumberResponse
                {
                    Id = item.Id,
                    PhoneNumber = item.PhoneNumber
                })));
        }
    }
}
