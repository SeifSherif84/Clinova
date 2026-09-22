using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Paymob
{
    public class PaymobTransactionInquiryOrder
    {
        public long Id { get; set; }
        public long AmountCents { get; set; }
        public string? Currency { get; set; }
    }
}
