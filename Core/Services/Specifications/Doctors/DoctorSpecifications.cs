using Domain.Entities.BusinessEntities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Specifications.Doctors
{
    public class DoctorSpecifications : BaseSpecifications<Doctor, string>
    {
        public DoctorSpecifications(string doctorId) : base()
        {
            ApplyFilteration(doctorId);
            ApplyIncludes();
        }


        private void ApplyFilteration(string doctorId)
        {
            Criteria = doctor => doctor.Id == doctorId;
        }

        private void ApplyIncludes()
        {
            Includes.Add(doctor => doctor.MedicalSpecialty);
        }
    }
}
