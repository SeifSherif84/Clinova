using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Services.Specifications.ClinicManualPaymentMethods;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Specifications.ClinicOnlinePaymentAccounts
{
    public class ClinicOnlinePaymentAccountSpecifications : BaseSpecifications<ClinicOnlinePaymentAccount, int>
    {
        private ClinicOnlinePaymentAccountSpecifications() : base()
        {

        }

        public static ClinicOnlinePaymentAccountSpecifications ByClinicAndProvider(int clinicId, OnlinePaymentProvider provider)
        {
            return new ClinicOnlinePaymentAccountSpecifications
            {
                Criteria = paymentAccount => paymentAccount.ClinicId == clinicId &&
                                             paymentAccount.Provider == provider 
            };
        }

        public static ClinicOnlinePaymentAccountSpecifications ByClinic(int clinicId)
        {
            var specifications = new ClinicOnlinePaymentAccountSpecifications()
            {
                Criteria = paymentAccount => paymentAccount.ClinicId == clinicId
            };

            specifications.Includes.Add(paymentAccount => paymentAccount.PaymentIntegrations);
            return specifications;
        }
    }
}
