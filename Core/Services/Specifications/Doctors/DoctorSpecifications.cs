using Domain.Entities.BusinessEntities;
using Services.Clinics;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Specifications.Doctors
{
    public class DoctorSpecifications : BaseSpecifications<Doctor, string>
    {
        // constructor to get doctor by id and include medical specialty
        public DoctorSpecifications(string doctorId) : base()
        {
            ApplyCriteriaToGetSpecificDoctor(doctorId);
            ApplyIncludes();
        }

        private void ApplyCriteriaToGetSpecificDoctor(string doctorId)
        {
            Criteria = doctor => doctor.Id == doctorId;
        }
        private void ApplyIncludes()
        {
            Includes.Add(doctor => doctor.MedicalSpecialty);
        }


        // constructor to get doctors for a specific clinic based on the scope (owner or all members)
        public DoctorSpecifications(int clinicId, ClinicDoctorScope scope)
        {
            ApplyCriteriaToGetDoctorsForSpecificClinicBasedOnScope(clinicId, scope);
            ApplyClinicMemberIncludes(clinicId);
        }
        private void ApplyCriteriaToGetDoctorsForSpecificClinicBasedOnScope(int clinicId, ClinicDoctorScope scope)
        {
            Criteria = scope switch
            {
                ClinicDoctorScope.Owner => doctor => doctor.DoctorClinics.Any(dc => dc.ClinicId == clinicId && dc.IsOwner),
                ClinicDoctorScope.AllMembers => doctor => doctor.DoctorClinics.Any(dc => dc.ClinicId == clinicId),
                _ => throw new ArgumentOutOfRangeException(nameof(scope))
            };
        }

        private void ApplyClinicMemberIncludes(int clinicId)
        {
            ApplyIncludes();
            Includes.Add(doctor => doctor.DoctorClinics.Where(dc => dc.ClinicId == clinicId));
        }
    }
}
