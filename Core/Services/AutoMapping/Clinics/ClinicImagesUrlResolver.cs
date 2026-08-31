using AutoMapper;
using AutoMapper.Execution;
using Domain.Entities.BusinessEntities;
using Microsoft.Extensions.Configuration;
using Shared.Dtos.Clinics;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.AutoMapping.Clinics
{
    public class ClinicImagesUrlResolver(IConfiguration _configuration) : IValueResolver<Clinic, ClinicDetailsResponse, List<string>>
    {
        public List<string> Resolve(Clinic source, ClinicDetailsResponse destination, List<string> destMember, ResolutionContext context)
        {
            if(source.Images is null)
                destMember = new List<string>();
            else
            {
                var baseUrl = _configuration["BaseURL"];
                var imagesFolderPath = _configuration["MediaSettings:ClinicImagesPath"];
                destMember = source.Images.Select(item => $"{baseUrl}/{imagesFolderPath}/{item.Image}").ToList();
            }
            return destMember;
        }
    }
}
