using Domain.Entities.Common;
using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.BusinessEntities
{
    public class ClinicOnlinePaymentAccount : BaseEntity<int>
    {
        public OnlinePaymentProvider Provider { get; set; }


        // Paymob Merchant ID (MID)
        public string MerchantId { get; set; } = null!;

        public OnlinePaymentAccountStatus Status { get; set; } = OnlinePaymentAccountStatus.NotConfigured;


        // Paymob Credentials
        public string? PublicKey { get; set; }

        // IMPORTANT:
        // SecretKey and HmacSecret should be encrypted at rest.
        public string SecretKey { get; set; } = null!;
        public string HmacSecret { get; set; } = null!;


        // Supported Paymob Integrations
        public ICollection<ClinicPaymentIntegration> PaymentIntegrations { get; set; } = new List<ClinicPaymentIntegration>();


        public int ClinicId { get; set; }
        public Clinic Clinic { get; set; } = null!;


        // Payments processed through this account
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }
}
