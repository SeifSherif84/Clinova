using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.ClinicOnlinePaymentAccounts
{
    public class UpdatePaymobAccountRequest
    {
        public string? PublicKey { get; set; }
        public string? SecretKey { get; set; }
        public string? HmacSecret { get; set; }
        public string? ApiKey { get; set; }
    }
}
