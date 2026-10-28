using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Specifications.DepositRefunds
{
    public class DepositRefundSpecifications : BaseSpecifications<DepositRefund, int>
    {
        public DepositRefundSpecifications() : base()
        {

        }

        public static DepositRefundSpecifications PendingVerification()
        {
            var specifications = new DepositRefundSpecifications
            {
                Criteria = refund => refund.Status == DepositRefundStatus.PendingVerification
            };

            return specifications;
        }
    }
}
