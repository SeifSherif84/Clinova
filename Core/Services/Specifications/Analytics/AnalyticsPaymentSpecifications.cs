using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;

namespace Services.Specifications.Analytics
{
    public class AnalyticsPaymentSpecifications : BaseSpecifications<DepositPayment, int>
    {
        private AnalyticsPaymentSpecifications() : base()
        {

        }

        public static AnalyticsPaymentSpecifications ForClinic(int clinicId, DateTime? fromUtc, DateTime? toUtcExclusive)
        {
            var specification = new AnalyticsPaymentSpecifications
            {
                Criteria = payment => payment.Appointment.AppointmentSlot.ClinicId == clinicId &&
                    (
                        // Deposit payments collected during the selected period.
                        ((payment.Status == DepositPaymentStatus.Paid || payment.Status == DepositPaymentStatus.Refunded) &&
                         (payment.PaidAt.HasValue) &&
                         (!fromUtc.HasValue || payment.PaidAt.Value >= fromUtc.Value) &&
                         (!toUtcExclusive.HasValue || payment.PaidAt.Value < toUtcExclusive.Value))
                        ||

                        // Manual deposit payments awaiting verification.
                        ((payment.Status == DepositPaymentStatus.PendingVerification) &&
                         (!fromUtc.HasValue || payment.CreatedAt >= fromUtc.Value) &&
                         (!toUtcExclusive.HasValue || payment.CreatedAt < toUtcExclusive.Value))
                        ||

                        // Successfully processed deposit refunds during the selected period.
                        ((payment.DepositRefund != null && payment.DepositRefund.Status == DepositRefundStatus.Succeeded) &&
                         (payment.DepositRefund.ProcessedAt.HasValue) &&
                         (!fromUtc.HasValue || payment.DepositRefund.ProcessedAt.Value >= fromUtc.Value) &&
                         (!toUtcExclusive.HasValue || payment.DepositRefund.ProcessedAt.Value < toUtcExclusive.Value))
                        ||

                        // Remaining payments collected during the selected period.
                        ((payment.Appointment.RemainingPayment != null && payment.Appointment.RemainingPayment.Status == RemainingPaymentStatus.Paid) &&
                         (payment.Appointment.RemainingPayment.PaidAt.HasValue) &&
                         (!fromUtc.HasValue || payment.Appointment.RemainingPayment.PaidAt.Value >= fromUtc.Value) &&
                         (!toUtcExclusive.HasValue || payment.Appointment.RemainingPayment.PaidAt.Value < toUtcExclusive.Value))
                    )
            };

            specification.Includes.Add(payment => payment.Appointment);
            specification.Includes.Add(payment => payment.Appointment.AppointmentSlot);
            specification.Includes.Add(payment => payment.DepositRefund);
            specification.Includes.Add(payment => payment.Appointment.RemainingPayment);

            return specification;
        }
    }
}
