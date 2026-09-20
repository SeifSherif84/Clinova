using Shared.Dtos.ClinicPaymentIntegrations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.ClinicOnlinePaymentAccounts
{
    public class ClinicOnlinePaymentAccountResponseForOwner
    {
        public int Id { get; set; }
        public string Provider { get; set; } = null!;
        public string MerchantId { get; set; } = null!;
        public string Status { get; set; } = null!;
        public bool IsReady { get; set; }

        public List<ClinicPaymentIntegrationResponse> Integrations { get; set; } = new();
    }
}
