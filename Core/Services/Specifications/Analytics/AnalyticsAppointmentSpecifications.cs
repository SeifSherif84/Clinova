using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;


namespace Services.Specifications.Analytics
{
    public class AnalyticsAppointmentSpecifications : BaseSpecifications<Appointment, int>
    {
        private AnalyticsAppointmentSpecifications() : base()
        {

        }

        public static AnalyticsAppointmentSpecifications ForClinic(int clinicId, DateOnly? fromDate, DateOnly? toDate)
        {
            var specification = new AnalyticsAppointmentSpecifications
            {
                Criteria = appointment => (appointment.AppointmentSlot.ClinicId == clinicId) &&
                                          (!fromDate.HasValue || appointment.AppointmentSlot.Date >= fromDate.Value) &&
                                          (!toDate.HasValue || appointment.AppointmentSlot.Date <= toDate.Value)
            };

            specification.Includes.Add(appointment => appointment.AppointmentSlot);
            specification.Includes.Add(appointment => appointment.AppointmentSlot.Doctor);
            specification.Includes.Add(appointment => appointment.DepositPayment);
            specification.Includes.Add(appointment => appointment.DepositPayment.DepositRefund);

            return specification;
        }


        public static AnalyticsAppointmentSpecifications ForClinicFinancialMovements(int clinicId, DateTime? fromUtc, DateTime? toUtcExclusive)
        {
            var specification = new AnalyticsAppointmentSpecifications
            {
                Criteria = appointment => appointment.AppointmentSlot.ClinicId == clinicId &&
                    (
                        // Deposits collected during the selected period.
                        ((appointment.DepositPayment != null) &&
                         (appointment.DepositPayment.Status == DepositPaymentStatus.Paid) &&
                         (appointment.DepositPayment.PaidAt.HasValue) &&
                         (!fromUtc.HasValue || appointment.DepositPayment.PaidAt.Value >= fromUtc.Value) &&
                         (!toUtcExclusive.HasValue || appointment.DepositPayment.PaidAt.Value < toUtcExclusive.Value))
                        ||

                        // Remaining payments collected during the selected period.
                        ((appointment.RemainingPayment != null) &&
                         (appointment.RemainingPayment.Status == RemainingPaymentStatus.Paid) &&
                         (appointment.RemainingPayment.PaidAt.HasValue) &&
                         (!fromUtc.HasValue || appointment.RemainingPayment.PaidAt.Value >= fromUtc.Value) &&
                         (!toUtcExclusive.HasValue || appointment.RemainingPayment.PaidAt.Value < toUtcExclusive.Value))
                    )
            };

            specification.Includes.Add(appointment => appointment.AppointmentSlot);
            specification.Includes.Add(appointment => appointment.AppointmentSlot.Doctor);
            specification.Includes.Add(appointment => appointment.DepositPayment);
            specification.Includes.Add(appointment => appointment.RemainingPayment);

            return specification;
        }

    }
}
