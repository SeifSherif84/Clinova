using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Shared.Dtos.Paymob
{
    public class PaymobTransactionCallbackRequest
    {
        [JsonPropertyName("type")]
        public string? Type { get; set; }


        [JsonPropertyName("obj")]
        public PaymobTransactionCallbackObject Obj { get; set; } = null!;
    }
}
