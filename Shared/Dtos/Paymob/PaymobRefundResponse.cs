using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Paymob
{
    public class PaymobRefundResponse
    {
        public long Id { get; set; }
        public bool Success { get; set; }
        public bool Pending { get; set; }
        public bool IsRefund { get; set; }
        public bool IsRefunded { get; set; }
        public long? RefundedAmountCents { get; set; }
        public long? RefundedAmountCentsInt { get; set; }
        public string? ErrorOccurred { get; set; }
        public string? Message { get; set; }
    }
}
