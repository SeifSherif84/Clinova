using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;

namespace Services.Specifications.Analytics
{
    public class AnalyticsPaymentSpecifications : BaseSpecifications<Payment, int>
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
                        // Payments collected during the selected period.
                        ((payment.Status == PaymentStatus.Paid || payment.Status == PaymentStatus.Refunded) &&
                         payment.PaidAt.HasValue &&
                         (!fromUtc.HasValue || payment.PaidAt.Value >= fromUtc.Value) &&
                         (!toUtcExclusive.HasValue || payment.PaidAt.Value < toUtcExclusive.Value))
                        ||

                        // Manual payments awaiting verification.
                        (payment.Status == PaymentStatus.PendingVerification &&
                         (!fromUtc.HasValue || payment.CreatedAt >= fromUtc.Value) &&
                         (!toUtcExclusive.HasValue || payment.CreatedAt < toUtcExclusive.Value))
                        ||

                        // Successfully processed refunds during the selected period.
                        (payment.Refund != null &&
                         payment.Refund.Status == RefundStatus.Succeeded &&
                         payment.Refund.ProcessedAt.HasValue &&
                         (!fromUtc.HasValue || payment.Refund.ProcessedAt.Value >= fromUtc.Value) &&
                         (!toUtcExclusive.HasValue || payment.Refund.ProcessedAt.Value < toUtcExclusive.Value))
                        ||

                        // Appointments whose remaining amount was collected during the selected period.
                        (payment.Appointment.RemainingAmountCollectedAt.HasValue &&
                        (!fromUtc.HasValue || payment.Appointment.RemainingAmountCollectedAt.Value >= fromUtc.Value) &&
                        (!toUtcExclusive.HasValue || payment.Appointment.RemainingAmountCollectedAt.Value < toUtcExclusive.Value))
                    )
            };

            specification.Includes.Add(payment => payment.Appointment);
            specification.Includes.Add(payment => payment.Appointment.AppointmentSlot);
            specification.Includes.Add(payment => payment.Appointment.AppointmentSlot.Doctor);
            specification.Includes.Add(payment => payment.Refund);

            return specification;
        }
    }
}
