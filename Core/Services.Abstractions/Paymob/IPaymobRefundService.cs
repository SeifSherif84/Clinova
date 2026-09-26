using Domain.Entities.Enums;
using Shared.Dtos.Paymob;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.Paymob
{
    public interface IPaymobRefundService
    {
        Task<RefundResult> RefundPaymentAsync(int paymentId, RefundReason reason);
        Task VerifyPendingRefundsAsync();
    }
}
