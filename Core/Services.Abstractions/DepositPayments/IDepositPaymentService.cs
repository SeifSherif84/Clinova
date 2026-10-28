using Shared.Dtos.DepositPayments;
using Shared.Dtos.Paymob;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.DepositPayments
{
    public interface IDepositPaymentService
    {
        Task<object> CreatePaymobPaymentIntentionAsync(string userId, int appointmentId, CreatePaymobPaymentIntentionRequest request);

        Task<PaymentConfigurationStatusResponse> GetPaymentConfigurationStatusAsync(string userId, int clinicId);

        Task HandlePaymobTransactionCallbackAsync(PaymobTransactionCallbackRequest request, string hmac);
    }
}
