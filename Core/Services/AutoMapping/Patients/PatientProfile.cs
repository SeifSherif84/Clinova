using AutoMapper;
using Domain.Entities.BusinessEntities;
using Microsoft.Extensions.Configuration;
using Shared.Dtos.Patients;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.AutoMapping.Patients
{
    public class PatientProfile : Profile
    {
        public PatientProfile(IConfiguration _configuration)
        {
            CreateMap<Patient, PatientProfileResponse>()
                .ForMember(dest => dest.ProfilePicture, config => config.MapFrom(new ProfilePictureUrlResolver(_configuration)));

            CreateMap<UpdatePatientProfileRequest, Patient>()
                .ForAllMembers(config => config.Condition((S, D, srcMember) => srcMember != null));
        }
    }
}
