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
            specification.Includes.Add(appointment => appointment.DepositPayment);

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
            specification.Includes.Add(appointment => appointment.DepositPayment);

            return specification;
        }

        public static AppointmentSpecifications ForCancellation(int appointmentId)
        {
            var specification = new AppointmentSpecifications
            {
                Criteria = appointment => appointment.Id == appointmentId
            };

            specification.Includes.Add(appointment => appointment.AppointmentSlot);
            specification.Includes.Add(appointment => appointment.DepositPayment);
            specification.Includes.Add(appointment => appointment.RemainingPayment);
            specification.Includes.Add(appointment => appointment.DepositPayment.DepositRefund);

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
            specification.Includes.Add(appointment => appointment.DepositPayment);

            return specification;
        }


        public static AppointmentSpecifications AnotherActiveAppointmentForSlot(int appointmentSlotId,
                                                                                int excludedAppointmentId)
        {
            return new AppointmentSpecifications
            {
                Criteria = appointment => appointment.AppointmentSlotId == appointmentSlotId &&
                                          appointment.Id != excludedAppointmentId &&
                                          (appointment.Status == AppointmentStatus.PendingPayment ||
                                           appointment.Status == AppointmentStatus.PendingVerification ||
                                           appointment.Status == AppointmentStatus.Confirmed)
            };
        }


        public static AppointmentSpecifications ById(int appointmentId)
        {
            var specification = new AppointmentSpecifications
            {
                Criteria = appointment => appointment.Id == appointmentId
            };

            specification.Includes.Add(appointment => appointment.AppointmentSlot);
            specification.Includes.Add(appointment => appointment.DepositPayment);
            specification.Includes.Add(appointment => appointment.RemainingPayment);
            specification.Includes.Add(appointment => appointment.DepositPayment.ClinicOnlinePaymentAccount);

            return specification;
        }


        public static AppointmentSpecifications ByIdWithRefund(int appointmentId)
        {
            var specification = new AppointmentSpecifications
            {
                Criteria = appointment => appointment.Id == appointmentId
            };

            specification.Includes.Add(appointment => appointment.AppointmentSlot);
            specification.Includes.Add(appointment => appointment.DepositPayment);
            specification.Includes.Add(appointment => appointment.RemainingPayment);
            specification.Includes.Add(appointment => appointment.DepositPayment.DepositRefund);

            return specification;
        }

        public static AppointmentSpecifications ByIdWithDetailsForSecretary(int appointmentId)
        {
            var specification = new AppointmentSpecifications
            {
                Criteria = appointment => appointment.Id == appointmentId &&

                    // Hide temporary reservations.
                    // PaymentStatus.Pending means the patient has not completed
                    // the payment process yet, so this is not a real booking.
                    (
                        appointment.DepositPayment.Status == DepositPaymentStatus.PendingVerification ||
                        appointment.DepositPayment.Status == DepositPaymentStatus.Paid ||
                        appointment.DepositPayment.Status == DepositPaymentStatus.Rejected ||
                        appointment.DepositPayment.Status == DepositPaymentStatus.Refunded
                    ) 
            };

            specification.Includes.Add(appointment => appointment.AppointmentSlot);
            specification.Includes.Add(appointment => appointment.AppointmentSlot.Doctor);
            specification.Includes.Add(appointment => appointment.Patient);
            specification.Includes.Add(appointment => appointment.DepositPayment);
            specification.Includes.Add(appointment => appointment.RemainingPayment);
            specification.Includes.Add(appointment => appointment.DepositPayment.ClinicManualPaymentMethod);
            specification.Includes.Add(appointment => appointment.DepositPayment.DepositRefund);

            return specification;
        }



        public static AppointmentSpecifications ForClinicSecretary(int clinicId,
                                                                   string? doctorName,
                                                                   string? patientSearch,
                                                                   DateOnly? slotDate,
                                                                   AppointmentStatus? appointmentStatus,
                                                                   DepositPaymentStatus? paymentStatus,
                                                                   int pageIndex,
                                                                   int pageSize,
                                                                   bool applyPagination)
        {
            var specification = new AppointmentSpecifications
            {
                Criteria = appointment => appointment.AppointmentSlot.ClinicId == clinicId &&

                    // Hide temporary reservations.
                    // PaymentStatus.Pending means the patient has not completed
                    // the payment process yet, so this is not a real booking.
                    (appointment.DepositPayment.Status == DepositPaymentStatus.PendingVerification ||
                     appointment.DepositPayment.Status == DepositPaymentStatus.Paid ||
                     appointment.DepositPayment.Status == DepositPaymentStatus.Rejected || 
                     appointment.DepositPayment.Status == DepositPaymentStatus.Refunded) &&


                    (doctorName == null || EF.Functions.Like(appointment.AppointmentSlot.Doctor.FirstName + " " +
                                                             appointment.AppointmentSlot.Doctor.LastName,
                                                             $"%{doctorName}%")) &&


                    (patientSearch == null ||
                    (appointment.Patient != null && EF.Functions.Like(appointment.Patient.FirstName + " " +
                                                                      appointment.Patient.LastName,
                                                                      $"%{patientSearch}%")) ||

                    (appointment.PatientId == null && EF.Functions.Like(appointment.GuestPatientName!,
                                                                        $"%{patientSearch}%")) ||

                    (appointment.PatientId == null && EF.Functions.Like(appointment.GuestPatientPhone!,
                                                                        $"%{patientSearch}%"))) &&


                    (!slotDate.HasValue || appointment.AppointmentSlot.Date == slotDate.Value) &&

                    (!appointmentStatus.HasValue || appointment.Status == appointmentStatus.Value) &&

                    (!paymentStatus.HasValue || appointment.DepositPayment.Status == paymentStatus.Value)
            };


            specification.OrderBy = appointment => appointment.AppointmentSlot.Date;
            specification.ThenBy = appointment => appointment.AppointmentSlot.StartTime;


            if (applyPagination)
            {
                specification.IsPaginationEnabled = true;
                specification.Skip = (pageIndex - 1) * pageSize;
                specification.Take = pageSize;
            }


            if (applyPagination)
            {
                specification.Includes.Add(appointment => appointment.AppointmentSlot);
                specification.Includes.Add(appointment => appointment.AppointmentSlot.Doctor);
                specification.Includes.Add(appointment => appointment.Patient);
                specification.Includes.Add(appointment => appointment.DepositPayment);
                specification.Includes.Add(appointment => appointment.RemainingPayment);
                specification.Includes.Add(appointment => appointment.DepositPayment.ClinicManualPaymentMethod);
                specification.Includes.Add(appointment => appointment.DepositPayment.DepositRefund);
            }

            return specification;
        }

    }
}
