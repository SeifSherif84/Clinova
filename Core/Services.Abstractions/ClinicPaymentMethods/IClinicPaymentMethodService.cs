using Shared.Dtos.ClinicPaymentMethods;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.ClinicPaymentMethods
{
    public interface IClinicPaymentMethodService
    {
        Task<string> AddClinicPaymentMethodAsync(string userId, int clinicId, AddClinicPaymentMethodRequest request);
        Task<IEnumerable<ClinicPaymentMethodResponseForPatient>> GetClinicPaymentMethodsForPatientAsync(string userId, int clinicId);
        Task<IEnumerable<ClinicPaymentMethodResponseForOwner>> GetClinicPaymentMethodsForOwnerAsync(string userId, int clinicId);
        Task<string> UpdateClinicPaymentMethodAsync(string userId, int clinicId, int paymentMethodId, UpdateClinicPaymentMethodRequest request);
        Task<string> ActivateClinicPaymentMethodAsync(string userId, int clinicId, int paymentMethodId);
        Task<string> DeactivateClinicPaymentMethodAsync(string userId, int clinicId, int paymentMethodId);
        Task<string> DeleteClinicPaymentMethodAsync(string userId, int clinicId, int paymentMethodId);
    }
}
