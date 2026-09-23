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
    public class ClinicImagesUrlResolver(IConfiguration _configuration) : IValueResolver<Clinic, ClinicDetailsResponse, List<ClinicImageResponse>>
    {
        public List<ClinicImageResponse> Resolve(Clinic source, ClinicDetailsResponse destination, List<ClinicImageResponse> destMember, ResolutionContext context)
        {
            if(source.Images is null)
                destMember = new List<ClinicImageResponse>();
            else
            {
                var baseUrl = _configuration["BaseURL"];
                var imagesFolderPath = _configuration["MediaSettings:ClinicImagesPath"];
                destMember = source.Images.Select(item => new ClinicImageResponse
                {
                    Id = item.Id,
                    Url = $"{baseUrl}/{imagesFolderPath}/{item.Image}"
                }).ToList();
            }
            return destMember;
        }
    }
}
