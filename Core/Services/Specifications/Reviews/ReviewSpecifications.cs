using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Specifications.Reviews
{
    public class ReviewSpecifications : BaseSpecifications<Domain.Entities.BusinessEntities.Review, int>
    {
        public ReviewSpecifications()
        {

        }

        public static ReviewSpecifications CheckIfReviewExistForThisAppointment(int appointmentId)
        {
            var specification = new ReviewSpecifications()
            {
                Criteria = review => review.AppointmentId == appointmentId
            };
            return specification;
        }

        public static ReviewSpecifications PatientGetDoctorReviews(string doctorId,
                                                                   int pageIndex,
                                                                   int pageSize,
                                                                   bool applyPagination)
        {
            var specification = new ReviewSpecifications
            {
                Criteria = review => review.Appointment.AppointmentSlot.DoctorId == doctorId &&
                           review.Status == ReviewStatus.Approved
            };

            specification.OrderByDescending = review => review.CreatedAt;

            if (applyPagination)
            {
                specification.IsPaginationEnabled = true;
                specification.Skip = (pageIndex - 1) * pageSize;
                specification.Take = pageSize;
                specification.Includes.Add(review => review.Appointment);
                specification.Includes.Add(review => review.Appointment.Patient);
            }

            return specification;
        }


        public static ReviewSpecifications PatientGetHisOwnReviews(string patientId)
        {
            var specification = new ReviewSpecifications()
            {
                Criteria = review => review.Appointment.PatientId == patientId
            };

            specification.OrderByDescending = review => review.CreatedAt;

            specification.Includes.Add(review => review.Appointment);
            specification.Includes.Add(review => review.Appointment.AppointmentSlot);
            specification.Includes.Add(review => review.Appointment.AppointmentSlot.Doctor);
            specification.Includes.Add(review => review.Appointment.AppointmentSlot.Clinic);

            return specification;
        }


        public static ReviewSpecifications PatientGetDoctorRatingSummary(string doctorId, int? rating)
        {
            var specification = new ReviewSpecifications()
            {
                Criteria = review => review.Appointment.AppointmentSlot.DoctorId == doctorId &&
                           review.Status == ReviewStatus.Approved &&
                           rating.HasValue ? review.Rating == rating.Value : true
            };

            return specification;
        }

        public static ReviewSpecifications DoctorGetHisReviews(string doctorId, 
                                                               int pageIndex, 
                                                               int pageSize, 
                                                               bool applyPagination)
        {
            var specification = new ReviewSpecifications
            {
                Criteria = review => review.Appointment.AppointmentSlot.DoctorId == doctorId &&
                                     review.Status == ReviewStatus.Approved
            };

            specification.OrderByDescending = review => review.CreatedAt;

            if (applyPagination)
            {
                specification.IsPaginationEnabled = true;
                specification.Skip = (pageIndex - 1) * pageSize;
                specification.Take = pageSize;
                specification.Includes.Add(review => review.Appointment);
                specification.Includes.Add(review => review.Appointment.Patient);
            }

            return specification;
        }


    }
}
