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

namespace Services.AutoMapping.Secretaries
{
    public class ProfilePictureUrlResolver<TDestination>(IConfiguration _configuration) : IValueResolver<Secretary, TDestination, string?>
    {
        public string? Resolve(Secretary source, TDestination destination, string? destMember, ResolutionContext context)
        {
            if(source.ProfilePicture is null)
                return null;

            var baseUrl = _configuration["BaseURL"];
            var imagesFolderPath = _configuration["MediaSettings:SecretaryProfileImagesPath"];
            destMember = $"{baseUrl}/{imagesFolderPath}/{source.ProfilePicture}";
            return destMember;
        }
    }
}
