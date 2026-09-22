using Domain.Entities.BusinessEntities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Specifications.Payments
{
    public class PaymentSpecifications : BaseSpecifications<Payment, int>
    {
        public PaymentSpecifications() : base()
        {

        }


        public static PaymentSpecifications ByProviderOrderId(string providerOrderId)
        {
            var specifications = new PaymentSpecifications()
            {
                Criteria = payment => payment.ProviderOrderId == providerOrderId,
            };

            specifications.Includes.Add(payment => payment.Appointment);
            specifications.Includes.Add(payment => payment.Appointment.AppointmentSlot);
            specifications.Includes.Add(payment => payment.ClinicOnlinePaymentAccount);
            specifications.Includes.Add(payment => payment.ClinicOnlinePaymentAccount!.PaymentIntegrations);

            return specifications;
        }


        public static PaymentSpecifications ForRefund(int paymentId)
        {
            var specifications = new PaymentSpecifications()
            {
                Criteria = payment => payment.Id == paymentId,
            };

            specifications.Includes.Add(payment => payment.Refund);
            specifications.Includes.Add(payment => payment.Appointment);
            specifications.Includes.Add(payment => payment.Appointment.AppointmentSlot);

            return specifications;
        }

    }
}
