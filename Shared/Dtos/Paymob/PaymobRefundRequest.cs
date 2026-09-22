using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Paymob
{
    public class PaymobRefundRequest
    {
        public long TransactionId { get; set; }
        public long AmountCents { get; set; }
    }
}
