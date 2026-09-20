using Shared.Dtos.Payments;
using Shared.Dtos.Paymob;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.Payments
{
    public interface IPaymentService
    {
        Task<object> CreatePaymobPaymentIntentionAsync(string userId, int appointmentId, CreatePaymobPaymentIntentionRequest request);

        Task HandlePaymobTransactionCallbackAsync(PaymobTransactionCallbackRequest request, string hmac);
    }
}
