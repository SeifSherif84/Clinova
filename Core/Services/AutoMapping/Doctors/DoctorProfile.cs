using AutoMapper;
using Domain.Entities.BusinessEntities;
using Microsoft.Extensions.Configuration;
using Shared.Dtos.Clinics;
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
                .ForMember(dest => dest.MedicalSpecialtyName, config => config.MapFrom(src => src.MedicalSpecialty.Name))
                .ForMember(dest => dest.NationalIdImageUrl, config => config.MapFrom(new NationalIdImageUrlResolver(_configuration)))
                .ForMember(dest => dest.SyndicateCardImageUrl, config => config.MapFrom(new SyndicateCardImageUrlResolver(_configuration)))
                .ForMember(dest => dest.ProfilePicture, config => config.MapFrom(new ProfilePictureUrlResolver<DoctorProfileResponse>(_configuration)))
                .ForMember(dest => dest.ApprovalStatusName, config => config.MapFrom(src => (src.ApprovalStatus).ToString()));


            CreateMap<UpdateDoctorProfileRequest, Doctor>()
                    .ForAllMembers(config => config.Condition((S, D, srcMember) => srcMember != null));


            CreateMap<Doctor, ClinicMemberResponseForDoctor>()
                .ForMember(dest => dest.FullName, config => config.MapFrom(src => $"Dr. {src.FirstName} {src.LastName}"))
                .ForMember(dest => dest.ProfilePicture, config => config.MapFrom(new ProfilePictureUrlResolver<ClinicMemberResponseForDoctor>(_configuration)))
                .ForMember(dest => dest.MedicalSpecialty, config => config.MapFrom(src => src.MedicalSpecialty.Name))
                .ForMember(dest => dest.IsOwner, config => config.MapFrom(src => src.DoctorClinics.FirstOrDefault().IsOwner))
                .ForMember(dest => dest.JoinedAt, config => config.MapFrom(src => src.DoctorClinics.FirstOrDefault().JoinedAt));


            CreateMap<Doctor, ClinicMemberResponseForSecretary>()
                .ForMember(dest => dest.FullName, config => config.MapFrom(src => $"Dr. {src.FirstName} {src.LastName}"))
                .ForMember(dest => dest.ProfilePicture, config => config.MapFrom(new ProfilePictureUrlResolver<ClinicMemberResponseForSecretary>(_configuration)))
                .ForMember(dest => dest.MedicalSpecialty, config => config.MapFrom(src => src.MedicalSpecialty.Name))
                .ForMember(dest => dest.IsOwner, config => config.MapFrom(src => src.DoctorClinics.FirstOrDefault().IsOwner));


            CreateMap<Doctor, PatientDoctorResponse>()
                .ForMember(dest => dest.DoctorId, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.DoctorName, opt => opt.MapFrom(src => $"Dr. {src.FirstName} {src.LastName}"))
                .ForMember(dest => dest.Title, opt => opt.MapFrom(src => src.Title))
                .ForMember(dest => dest.ExperienceYears, opt => opt.MapFrom(src => src.ExperienceYears))
                .ForMember(dest => dest.Bio, opt => opt.MapFrom(src => src.Bio))
                .ForMember(dest => dest.MedicalSpecialtyName, opt => opt.MapFrom(src => src.MedicalSpecialty.Name));
        }
    }
}
