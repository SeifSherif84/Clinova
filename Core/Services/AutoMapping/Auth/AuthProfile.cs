using AutoMapper;
using Domain.Entities.BusinessEntities;
using Microsoft.Extensions.Configuration;
using Services.AutoMapping.Doctors;
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
        public AuthProfile(IConfiguration _configuration)
        {
            CreateMap<DoctorRegistrationRequest, Doctor>()
                .ForMember(dest => dest.UserName, config => config.MapFrom(src => src.Email));

            CreateMap<PatientRegistrationRequest, Patient>()
                .ForMember(dest => dest.UserName, config => config.MapFrom(src => src.Email));

            CreateMap<SecretaryRegistrationRequest, Secretary>()
                .ForMember(dest => dest.UserName, config => config.MapFrom(src => src.Email));

            CreateMap<Doctor, AdminDoctorResponse>()
                .ForMember(dest => dest.DoctorId, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.DoctorName, opt => opt.MapFrom(src => $"{src.FirstName} {src.LastName}"))
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email ?? string.Empty))
                .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.PhoneNumber ?? string.Empty))
                .ForMember(dest => dest.ProfilePictureImageUrl, opt => opt.MapFrom(new ProfilePictureUrlResolver<AdminDoctorResponse>(_configuration)))
                .ForMember(dest => dest.SyndicateNumber, opt => opt.MapFrom(src => src.SyndicateNumber))
                .ForMember(dest => dest.SyndicateCardImageUrl, opt => opt.MapFrom(new SyndicateCardImageUrlResolver<AdminDoctorResponse>(_configuration)))
                .ForMember(dest => dest.NationalIdImageUrl, opt => opt.MapFrom(new NationalIdImageUrlResolver<AdminDoctorResponse>(_configuration)))
                .ForMember(dest => dest.MedicalSpecialty, opt => opt.MapFrom(src => src.MedicalSpecialty.Name))
                .ForMember(dest => dest.Title, opt => opt.MapFrom(src => src.Title))
                .ForMember(dest => dest.ExperienceYears, opt => opt.MapFrom(src => src.ExperienceYears))
                .ForMember(dest => dest.Bio, opt => opt.MapFrom(src => src.Bio))
                .ForMember(dest => dest.ApprovalStatus, opt => opt.MapFrom(src => src.ApprovalStatus.ToString()))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt));
        }
    }
}
