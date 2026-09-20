using Domain.Entities.Common;
using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.BusinessEntities
{
    public class ClinicPaymentIntegration : BaseEntity<int>
    {
        public OnlinePaymentMethod PaymentMethod { get; set; }

        // Paymob Integration ID
        public int IntegrationId { get; set; }

        public bool IsActive { get; set; } = true;


        // Online Payment Account
        public int ClinicOnlinePaymentAccountId { get; set; }
        public ClinicOnlinePaymentAccount ClinicOnlinePaymentAccount { get; set; } = null!;
    }
}
