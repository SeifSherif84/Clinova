using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Shared.Dtos.Paymob
{
    public class PaymobCreateIntentionResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = null!;


        [JsonPropertyName("intention_order_id")]
        public int IntentionOrderId { get; set; }


        [JsonPropertyName("client_secret")]
        public string ClientSecret { get; set; } = null!;


        [JsonPropertyName("status")]
        public string Status { get; set; } = null!;
    }
}
