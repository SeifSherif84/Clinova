using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Shared.Dtos.Paymob
{
    public class PaymobOrder
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }
    }
}
