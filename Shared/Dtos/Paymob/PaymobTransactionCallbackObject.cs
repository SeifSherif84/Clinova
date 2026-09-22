using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Shared.Dtos.Paymob
{

    public class PaymobTransactionCallbackObject
    {
        [JsonPropertyName("id")]
        public long Id { get; set; }


        [JsonPropertyName("pending")]
        public bool Pending { get; set; }


        [JsonPropertyName("amount_cents")]
        public int AmountCents { get; set; }


        [JsonPropertyName("success")]
        public bool Success { get; set; }


        [JsonPropertyName("is_auth")]
        public bool IsAuth { get; set; }


        [JsonPropertyName("is_capture")]
        public bool IsCapture { get; set; }


        [JsonPropertyName("is_standalone_payment")]
        public bool IsStandalonePayment { get; set; }


        [JsonPropertyName("is_voided")]
        public bool IsVoided { get; set; }


        [JsonPropertyName("is_refunded")]
        public bool IsRefunded { get; set; }


        [JsonPropertyName("is_3d_secure")]
        public bool Is3DSecure { get; set; }


        [JsonPropertyName("integration_id")]
        public int IntegrationId { get; set; }


        [JsonPropertyName("profile_id")]
        public int ProfileId { get; set; }


        [JsonPropertyName("owner")]
        public int Owner { get; set; }


        [JsonPropertyName("has_parent_transaction")]
        public bool HasParentTransaction { get; set; }

        [JsonPropertyName("order")]
        public PaymobOrder Order { get; set; } = null!;


        [JsonPropertyName("created_at")]
        public DateTime CreatedAt { get; set; }


        [JsonPropertyName("currency")]
        public string? Currency { get; set; }


        [JsonPropertyName("error_occured")]
        public bool ErrorOccurred { get; set; }


        [JsonPropertyName("source_data")]
        public PaymobSourceData? SourceData { get; set; }
    }
}
