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
    public class SyndicateCardImageUrlResolver(IConfiguration _configuration) : IValueResolver<Doctor, DoctorProfileResponse, string>
    {
        public string Resolve(Doctor source, DoctorProfileResponse destination, string destMember, ResolutionContext context)
        {
            if (string.IsNullOrEmpty(source.SyndicateCardImageUrl))
                return string.Empty;

            var baseUrl = _configuration["BaseURL"];
            var imagesFolderPath = _configuration["MediaSettings:DoctorSyndicateCardImagesPath"];
            destMember = $"{baseUrl}/{imagesFolderPath}/{source.SyndicateCardImageUrl}";
            return destMember;
        }
    }
}
