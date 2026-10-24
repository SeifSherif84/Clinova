using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Analytics
{
    public class FinancialOverviewResponse
    {
        public decimal TotalCollected { get; set; }
        public decimal PendingPayments { get; set; }
        public decimal TotalRefunds { get; set; }
        public decimal NetCollected { get; set; }
        public List<PaymentMethodBreakdownResponse> PaymentMethods { get; set; } = new List<PaymentMethodBreakdownResponse>();
    }
}
