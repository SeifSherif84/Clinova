using AutoMapper;
using Domain.Entities.BusinessEntities;
using Microsoft.Extensions.Configuration;
using Shared.Dtos.Doctors;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.AutoMapping.Doctors
{
    public class DoctorProfile : Profile
    {
        public DoctorProfile(IConfiguration _configuration)
        {
            CreateMap<Doctor, DoctorProfileResponse>()
                .ForMember(D => D.MedicalSpecialtyName, config => config.MapFrom(S => S.MedicalSpecialty.Name))
                .ForMember(D => D.NationalIdImageUrl, config => config.MapFrom(new NationalIdImageUrlResolver(_configuration)))
                .ForMember(D => D.SyndicateCardImageUrl, config => config.MapFrom(new SyndicateCardImageUrlResolver(_configuration)))
                .ForMember(D => D.ProfilePicture, config => config.MapFrom(new ProfilePictureUrlResolver(_configuration)))
                .ForMember(D => D.ApprovalStatusName, config => config.MapFrom(S => (S.ApprovalStatus).ToString()));

            CreateMap<UpdateDoctorProfileRequest, Doctor>()
                    .ForAllMembers(config => config.Condition((S, D, srcMember) => srcMember != null));

        }
    }
}
