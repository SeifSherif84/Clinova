using Domain.Entities.Enums;
using Shared.Dtos.Paymob;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.Paymob
{
    public interface IPaymobDepositRefundService
    {
        Task<DepositRefundResult> RefundPaymentAsync(int depositPaymentId, DepositRefundReason reason);
        Task VerifyPendingRefundsAsync();
    }
}
