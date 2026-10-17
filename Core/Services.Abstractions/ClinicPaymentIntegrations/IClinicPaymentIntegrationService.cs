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
        Task<string> UpdatePaymentIntegrationAsync(string userId, int integrationId, int accountId, int clinicId, UpdateClinicPaymentIntegrationRequest request);
        Task<string> DeletePaymentIntegrationAsync(string userId, int integrationId, int accountId, int clinicId);
        Task<string> ActivatePaymentIntegrationAsync(string userId, int integrationId, int accountId, int clinicId);
        Task<string> DeactivatePaymentIntegrationAsync(string userId, int integrationId, int accountId, int clinicId);

    }
}
