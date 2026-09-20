using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Paymob
{
    public class PaymobCreateIntentionRequest
    {
        public int Amount { get; set; }

        public string Currency { get; set; } = "EGP";

        public List<int> PaymentMethods { get; set; } = new();

        public List<PaymobItem> Items { get; set; } = new();

        public PaymobBillingData BillingData { get; set; } = new();

        public Dictionary<string, object>? Extras { get; set; }

        public string? SpecialReference { get; set; }

        public int? Expiration { get; set; }
    }

}
