using Domain.Entities.BusinessEntities;
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

        public static AnalyticsAppointmentSpecifications ForClinic(int clinicId,
                                                                   DateOnly? fromDate,
                                                                   DateOnly? toDate)
        {
            var specification = new AnalyticsAppointmentSpecifications
            {
                Criteria = appointment => appointment.AppointmentSlot.ClinicId == clinicId &&
                                         (!fromDate.HasValue || appointment.AppointmentSlot.Date >= fromDate.Value) &&
                                         (!toDate.HasValue || appointment.AppointmentSlot.Date <= toDate.Value)
            };

            specification.Includes.Add(appointment => appointment.AppointmentSlot);
            specification.Includes.Add(appointment => appointment.AppointmentSlot.Doctor);
            specification.Includes.Add(appointment => appointment.Payment);
            specification.Includes.Add(appointment => appointment.Payment.Refund);

            return specification;
        }
    }
}
