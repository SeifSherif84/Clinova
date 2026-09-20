using Shared.Dtos.ClinicPaymentIntegrations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.ClinicOnlinePaymentAccounts
{
    internal class PaymobAccountConfigurationResponse
    {
        public int AccountId { get; set; }
        public string MerchantId { get; set; } = null!;
        public string Status { get; set; } = null!;
        public bool IsReady { get; set; }
        public List<ClinicPaymentIntegrationResponse> Integrations { get; set; } = new();
    }
}
