using AutoMapper;
using Domain.Entities.BusinessEntities;
using Shared.Dtos.Auth;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static Org.BouncyCastle.Math.EC.ECCurve;

namespace Services.AutoMapping.Auth
{
    public class AuthProfile : Profile
    {
        public AuthProfile()
        {
            CreateMap<DoctorRegistrationRequest, Doctor>()
                .ForMember(dest => dest.UserName, config => config.MapFrom(src => src.Email));

            CreateMap<PatientRegistrationRequest, Patient>()
                .ForMember(dest => dest.UserName, config => config.MapFrom(src => src.Email));

            CreateMap<SecretaryRegistrationRequest, Secretary>()
                .ForMember(dest => dest.UserName, config => config.MapFrom(src => src.Email));
        }
    }
}
