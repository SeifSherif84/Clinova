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
                .ForMember(D => D.UserName, config => config.MapFrom(S => S.Email));

            CreateMap<PatientRegistrationRequest, Patient>()
                .ForMember(D => D.UserName, config => config.MapFrom(S => S.Email));
        }
    }
}
