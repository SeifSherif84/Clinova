using AutoMapper;
using AutoMapper.Execution;
using AutoMapper.Internal;
using Domain.Entities.BusinessEntities;
using Microsoft.Extensions.Configuration;
using Shared.Dtos.Patients;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace Services.AutoMapping.Secretaries
{
    public class NationalIdImageUrlResolver(IConfiguration _configuration) : IValueResolver<Secretary, SecretaryProfileResponse, string>
    {
        public string Resolve(Secretary source, SecretaryProfileResponse destination, string destMember, ResolutionContext context)
        {
            if (string.IsNullOrEmpty(source.NationalIdImageUrl))
                return string.Empty;

            var baseUrl = _configuration["BaseURL"];
            var imagesFolderPath = _configuration["MediaSettings:SecretaryNationalIdImagesPath"];
            destMember = $"{baseUrl}/{imagesFolderPath}/{source.NationalIdImageUrl}";
            return destMember;
        }
    }
}
