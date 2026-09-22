using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Paymob
{
    public class PaymobTransactionInquiryResponse
    {
        public long Id { get; set; }
        public bool Pending { get; set; }
        public long AmountCents { get; set; }
        public bool Success { get; set; }
        public bool IsVoided { get; set; }
        public bool IsRefunded { get; set; }
        public long IntegrationId { get; set; }
        public string? Currency { get; set; }
        public long? RefundedAmountCents { get; set; }
        public long? RefundedAmountCentsInt { get; set; }
        public PaymobTransactionInquiryOrder? Order { get; set; }
    }
}
