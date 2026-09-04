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
    public class ProfilePictureUrlResolver<TDestination>(IConfiguration _configuration)
        : IValueResolver<Doctor, TDestination, string?>
    {

        public string? Resolve(Doctor source, TDestination destination, string? destMember, ResolutionContext context)
        {
            if (string.IsNullOrEmpty(source.ProfilePicture))
                return null;

            var baseUrl = _configuration["BaseURL"];
            var imagesFolderPath = _configuration["MediaSettings:DoctorProfileImagesPath"];
            destMember = $"{baseUrl}/{imagesFolderPath}/{source.ProfilePicture}";
            return destMember;
        }
    }
}
