using AutoMapper;
using AutoMapper.Execution;
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
    public class ProfilePictureUrlResolver(IConfiguration _configuration) : IValueResolver<Patient, PatientProfileResponse, string?>
    {
        public string? Resolve(Patient source, PatientProfileResponse destination, string? destMember, ResolutionContext context)
        {
            if(source.ProfilePicture is null)
                return null;

            var baseUrl = _configuration["BaseURL"];
            var imagesFolderPath = _configuration["MediaSettings:PatientProfileImagesPath"];
            destMember = $"{baseUrl}/{imagesFolderPath}/{source.ProfilePicture}";
            return destMember;
        }
    }
}
