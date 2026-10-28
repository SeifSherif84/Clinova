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
    public class ManualRefundProofUrlResolver(IConfiguration _configuration) : IValueResolver<Appointment, SecretaryAppointmentDetailsResponse, string?>
    {
        public string? Resolve(Appointment source, SecretaryAppointmentDetailsResponse destination, string? destMember, ResolutionContext context)
        {
            if (source.DepositPayment.DepositRefund == null)
                return null;

            if (string.IsNullOrEmpty(source.DepositPayment.DepositRefund.ManualProofUrl))
                return null;

            var baseUrl = _configuration["BaseURL"];
            var imagesFolderPath = _configuration["MediaSettings:ManualRefundProofsPath"];
            destMember = $"{baseUrl}/{imagesFolderPath}/{source.DepositPayment.DepositRefund.ManualProofUrl}";
            return destMember;
        }
    }
}
