using AutoMapper;
using Domain.Entities.BusinessEntities;
using Shared.Dtos.Auth;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.AutoMapping.Auth
{
    public class AuthProfile : Profile
    {
        public AuthProfile()
        {
            CreateMap<DoctorRegistrationRequest, Doctor>()
                .ForMember(D => D.UserName, config => config.MapFrom(S => S.Email));
        }
    }
}
