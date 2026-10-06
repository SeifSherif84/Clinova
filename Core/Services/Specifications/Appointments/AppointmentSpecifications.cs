using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;
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



        public static AppointmentSpecifications ForClinicSecretary(int clinicId,
                                                                   string? doctorName,
                                                                   DateOnly? slotDate,
                                                                   AppointmentStatus? appointmentStatus,
                                                                   PaymentStatus? paymentStatus,
                                                                   int pageIndex,
                                                                   int pageSize,
                                                                   bool applyPagination)
        {
            var normalizedDoctorName = string.IsNullOrWhiteSpace(doctorName) ? null : doctorName.Trim();

            var specification = new AppointmentSpecifications
            {
                // Appointment belongs to the requested clinic.
                Criteria = appointment => appointment.AppointmentSlot.ClinicId == clinicId &&

                    // Hide temporary reservations.
                    // PaymentStatus.Pending means the patient has not completed
                    // the payment process yet, so this is not a real booking.
                    (
                        appointment.Payment.Status == PaymentStatus.PendingVerification ||
                        appointment.Payment.Status == PaymentStatus.Paid ||
                        appointment.Payment.Status == PaymentStatus.Rejected || 
                        appointment.Payment.Status == PaymentStatus.Refunded
                    ) &&

                    // Optional doctor name search.
                    (
                        normalizedDoctorName == null || EF.Functions.Like(appointment.AppointmentSlot.Doctor.FirstName +
                                                                          " " +
                                                                          appointment.AppointmentSlot.Doctor.LastName,
                                                                          $"%{normalizedDoctorName}%"
)
                    ) &&

                    // Optional slot date filter.
                    (
                        !slotDate.HasValue || appointment.AppointmentSlot.Date == slotDate.Value
                    ) &&

                    // Optional appointment status filter.
                    (
                        !appointmentStatus.HasValue || appointment.Status == appointmentStatus.Value
                    ) &&

                    // Optional payment status filter.
                    (
                        !paymentStatus.HasValue || appointment.Payment.Status == paymentStatus.Value
                    )
            };


            // Always order appointments by the actual slot date/time.
            specification.OrderBy = appointment => appointment.AppointmentSlot.Date;
            specification.ThenBy = appointment => appointment.AppointmentSlot.StartTime;


            if (applyPagination)
            {
                specification.IsPaginationEnabled = true;
                specification.Skip = (pageIndex - 1) * pageSize;
                specification.Take = pageSize;
            }


            // Required data for the response.
            if (applyPagination)
            {
                specification.Includes.Add(appointment => appointment.AppointmentSlot);
                specification.Includes.Add(appointment => appointment.AppointmentSlot.Doctor);
                specification.Includes.Add(appointment => appointment.Patient);
                specification.Includes.Add(appointment => appointment.Payment);
                specification.Includes.Add(appointment => appointment.Payment.ClinicManualPaymentMethod);
            }

            return specification;
        }

    }
}
