using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Analytics
{
    public class PaymentMethodBreakdownResponse
    {
        public string MethodType { get; set; } = null!;
        public string Category { get; set; } = null!;
        public decimal TotalCollected { get; set; }
        public decimal PendingPayments { get; set; }
        public decimal TotalRefunds { get; set; }
        public decimal NetCollected { get; set; }
    }
}
