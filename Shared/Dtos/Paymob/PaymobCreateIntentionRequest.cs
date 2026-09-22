using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Shared.Dtos.Paymob
{
    public class PaymobCreateIntentionRequest
    {
        [JsonPropertyName("amount")]
        public int Amount { get; set; }

        [JsonPropertyName("currency")]
        public string Currency { get; set; } = "EGP";

        [JsonPropertyName("payment_methods")]
        public List<int> PaymentMethods { get; set; } = new();

        [JsonPropertyName("items")]
        public List<PaymobItem> Items { get; set; } = new();

        [JsonPropertyName("billing_data")]
        public PaymobBillingData BillingData { get; set; } = new();

        [JsonPropertyName("extras")]
        public Dictionary<string, object>? Extras { get; set; }

        [JsonPropertyName("special_reference")]
        public string? SpecialReference { get; set; }

        [JsonPropertyName("expiration")]
        public int? Expiration { get; set; }

        [JsonPropertyName("notification_url")]
        public string? NotificationUrl { get; set; }
    }

}
