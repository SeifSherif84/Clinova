using Shared.Dtos.ClinicManualPaymentMethods;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.ClinicManualPaymentMethods
{
    public interface IClinicManualPaymentMethodService
    {
        Task<string> AddManualPaymentMethodAsync(string userId, int clinicId, AddClinicManualPaymentMethodRequest request);
        Task<string> UpdateManualPaymentMethodAsync(string userId, int clinicId, int paymentMethodId, UpdateClinicManualPaymentMethodRequest request);
        Task<IEnumerable<ClinicManualPaymentMethodResponseForPatient>> GetManualPaymentMethodsForPatientAsync(string userId, int clinicId);
        Task<IEnumerable<ClinicManualPaymentMethodResponseForOwner>> GetManualPaymentMethodsForOwnerAsync(string userId, int clinicId);
        Task<string> ActivateManualPaymentMethodAsync(string userId, int clinicId, int paymentMethodId);
        Task<string> DeactivateManualPaymentMethodAsync(string userId, int clinicId, int paymentMethodId);
        Task<string> DeleteManualPaymentMethodAsync(string userId, int clinicId, int paymentMethodId);
    }
}
