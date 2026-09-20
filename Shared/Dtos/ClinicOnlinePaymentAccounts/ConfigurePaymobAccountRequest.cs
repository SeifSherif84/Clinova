using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.ClinicOnlinePaymentAccounts
{
    public class ConfigurePaymobAccountRequest
    {
        [Required]
        public string MerchantId { get; set; } = null!;

        [Required]
        public string SecretKey { get; set; } = null!;

        [Required]
        public string HmacSecret { get; set; } = null!;
    }
}
