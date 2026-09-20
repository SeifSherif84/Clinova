using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Specifications.Appointments
{
    public class AppointmentSpecifications : BaseSpecifications<Appointment, int>
    {
        private AppointmentSpecifications() : base()
        {

        }

        public static AppointmentSpecifications ByPatientId(string patientId)
        {
            var specification = new AppointmentSpecifications
            {
                Criteria = appointment => appointment.PatientId == patientId,

                OrderBy = appointment => appointment.AppointmentSlot.Date,
                ThenBy = appointment => appointment.AppointmentSlot.StartTime
            };

            specification.Includes.Add(appointment => appointment.AppointmentSlot);
            specification.Includes.Add(appointment => appointment.AppointmentSlot.Doctor);
            specification.Includes.Add(appointment => appointment.AppointmentSlot.Clinic);
            specification.Includes.Add(appointment => appointment.Payment);

            return specification;
        }

        public static AppointmentSpecifications ByIdWithDetails(int appointmentId)
        {
            var specification = new AppointmentSpecifications
            {
                Criteria = appointment => appointment.Id == appointmentId
            };

            specification.Includes.Add(appointment => appointment.AppointmentSlot);
            specification.Includes.Add(appointment => appointment.AppointmentSlot.Doctor);
            specification.Includes.Add(appointment => appointment.AppointmentSlot.Clinic);
            specification.Includes.Add(appointment => appointment.Payment);

            return specification;
        }

        public static AppointmentSpecifications ForCancellation(int appointmentId)
        {
            var specification = new AppointmentSpecifications
            {
                Criteria = appointment => appointment.Id == appointmentId
            };

            specification.Includes.Add(appointment => appointment.AppointmentSlot);
            specification.Includes.Add(appointment => appointment.Payment);

            return specification;
        }



        public static AppointmentSpecifications GetExpiredPendingPaymentAppointments(DateTime now)
        {
            var specification = new AppointmentSpecifications
            {
                Criteria = appointment => appointment.Status == AppointmentStatus.PendingPayment &&
                                          appointment.ReservationExpiresAt <= now
            };

            specification.Includes.Add(appointment => appointment.AppointmentSlot);
            specification.Includes.Add(appointment => appointment.Payment);

            return specification;
        }



        public static AppointmentSpecifications ById(int appointmentId)
        {
            var specification = new AppointmentSpecifications
            {
                Criteria = appointment => appointment.Id == appointmentId
            };

            specification.Includes.Add(appointment => appointment.AppointmentSlot);
            specification.Includes.Add(appointment => appointment.Payment);

            return specification;
        }

    }
}
