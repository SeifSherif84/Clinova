using Domain.Entities.BusinessEntities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Specifications.Analytics
{
    public class AnalyticsDoctorSpecifications : BaseSpecifications<Doctor, string>
    {
        private AnalyticsDoctorSpecifications() : base()
        {

        }

        public static AnalyticsDoctorSpecifications ForClinic(int clinicId)
        {
            return new AnalyticsDoctorSpecifications
            {
                Criteria = doctor => doctor.DoctorClinics.Any(doctorClinic => doctorClinic.ClinicId == clinicId)
            };
        }
    }
}
