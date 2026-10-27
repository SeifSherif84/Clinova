using Domain.Entities.BusinessEntities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Specifications.DepositPayments
{
    public class DepositPaymentSpecifications : BaseSpecifications<DepositPayment, int>
    {
        public DepositPaymentSpecifications() : base()
        {

        }


        public static DepositPaymentSpecifications ByProviderOrderId(string providerOrderId)
        {
            var specifications = new DepositPaymentSpecifications()
            {
                Criteria = payment => payment.ProviderOrderId == providerOrderId,
            };

            specifications.Includes.Add(payment => payment.Appointment);
            specifications.Includes.Add(payment => payment.Appointment.AppointmentSlot);
            specifications.Includes.Add(payment => payment.ClinicOnlinePaymentAccount);
            specifications.Includes.Add(payment => payment.ClinicOnlinePaymentAccount!.PaymentIntegrations);

            return specifications;
        }


        public static DepositPaymentSpecifications ForRefund(int paymentId)
        {
            var specifications = new DepositPaymentSpecifications()
            {
                Criteria = payment => payment.Id == paymentId,
            };

            specifications.Includes.Add(payment => payment.DepositRefund);
            specifications.Includes.Add(payment => payment.Appointment);
            specifications.Includes.Add(payment => payment.Appointment.AppointmentSlot);

            return specifications;
        }

    }
}
