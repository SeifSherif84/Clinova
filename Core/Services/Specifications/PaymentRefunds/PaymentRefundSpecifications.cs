using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Specifications.PaymentRefunds
{
    public class PaymentRefundSpecifications : BaseSpecifications<PaymentRefund, int>
    {
        public PaymentRefundSpecifications() : base()
        {

        }

        public static PaymentRefundSpecifications PendingVerification()
        {
            var specifications = new PaymentRefundSpecifications
            {
                Criteria = refund => refund.Status == RefundStatus.PendingVerification
            };

            return specifications;
        }
    }
}
