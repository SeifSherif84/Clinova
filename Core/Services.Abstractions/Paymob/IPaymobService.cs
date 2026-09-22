using Shared.Dtos.Paymob;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.Paymob
{
    public interface IPaymobService
    {
        Task<PaymobCreateIntentionResponse> CreatePaymentIntentionAsync(string secretKey, PaymobCreateIntentionRequest request);
        Task<RefundResult> RefundAsync(string secretKey, long transactionId, long amountCents);
        Task<PaymobTransactionInquiryResult> GetTransactionAsync(string apiKey, long transactionId);
    }
}
