using Shared.Dtos.ClinicPaymentIntegrations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.ClinicPaymentIntegrations
{
    public interface IClinicPaymentIntegrationService
    {
        Task<string> AddPaymentIntegrationForPaymobAccountAsync(string userId, int accountId, int clinicId, AddClinicPaymentIntegrationRequest request);
    }
}
