using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Specifications.ClinicPaymentIntegrations
{
    public class ClinicPaymentIntegrationSpecifications : BaseSpecifications<ClinicPaymentIntegration, int>
    {
        public ClinicPaymentIntegrationSpecifications() : base()
        {

        }

        public static ClinicPaymentIntegrationSpecifications ByAccountAndPaymentMethod(int accountId, OnlinePaymentMethod paymentMethod)
        {
            return new ClinicPaymentIntegrationSpecifications()
            {
                Criteria = paymentIntegration => paymentIntegration.ClinicOnlinePaymentAccountId == accountId &&
                                                 paymentIntegration.PaymentMethod == paymentMethod,
            };
        }
    }
}
