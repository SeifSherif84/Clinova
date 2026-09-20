using Shared.Dtos.ClinicOnlinePaymentAccounts;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.ClinicOnlinePaymentAccounts
{
    public interface IClinicOnlinePaymentAccountService
    {
        Task<string> ConfigurePaymobAccountAsync(string userId, int clinicId, ConfigurePaymobAccountRequest request);
        Task<string> UpdatePaymobAccountAsync(string userId, int accountId, int clinicId, UpdatePaymobAccountRequest request);
        Task<IEnumerable<ClinicOnlinePaymentAccountResponseForOwner>> GetPaymentAccountsAsync(string userId, int clinicId);
    }
}
