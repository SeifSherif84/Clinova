using AutoMapper;
using Domain.Entities.BusinessEntities;
using Microsoft.Extensions.Configuration;
using Shared.Dtos.Appointments;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.AutoMapping.Appointments
{
    public class ManualDepositPaymentProofUrlResolver<TDestination>(IConfiguration _configuration) : IValueResolver<Appointment, TDestination, string?>
    {
        public string? Resolve(Appointment source, TDestination destination, string? destMember, ResolutionContext context)
        {
            if (string.IsNullOrEmpty(source.DepositPayment.ManualProofUrl))
                return null;

            var baseUrl = _configuration["BaseURL"];
            var imagesFolderPath = _configuration["MediaSettings:ManualDepositPaymentProofsPath"];
            destMember = $"{baseUrl}/{imagesFolderPath}/{source.DepositPayment.ManualProofUrl}";
            return destMember;
        }
    }
}
