using Domain.Entities.BusinessEntities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Specifications.Appointments
{
    public class AppointmentSpecifications : BaseSpecifications<Appointment, int>
    {
        public AppointmentSpecifications(string patientId) : base()
        {
            Criteria = appointment => appointment.PatientId == patientId;

            Includes.Add(appointment => appointment.AppointmentSlot);
            Includes.Add(appointment => appointment.AppointmentSlot.Doctor);
            Includes.Add(appointment => appointment.AppointmentSlot.Clinic);
            Includes.Add(appointment => appointment.Payment);

            OrderBy = appointment => appointment.AppointmentSlot.Date;
            ThenBy = appointment => appointment.AppointmentSlot.StartTime;
        }

        public AppointmentSpecifications(int appointmentId) : base()
        {
            Criteria = appointment => appointment.Id == appointmentId;

            Includes.Add(appointment => appointment.AppointmentSlot);
            Includes.Add(appointment => appointment.AppointmentSlot.Doctor);
            Includes.Add(appointment => appointment.AppointmentSlot.Clinic);
            Includes.Add(appointment => appointment.Payment);
        }
    }
}
