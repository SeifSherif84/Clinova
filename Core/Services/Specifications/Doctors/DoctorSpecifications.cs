using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;
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
        public DoctorSpecifications()
        {
            
        }


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
        public DoctorSpecifications(int clinicId, ClinicDoctorScope scope) : base()
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


        public static DoctorSpecifications GetDoctorsForPatient(string? doctorName,
                                                                int? medicalSpecialtyId,
                                                                int? governorateId,
                                                                int? regionId,
                                                                int pageIndex,
                                                                int pageSize,
                                                                bool applyPagination)
        {
            var specification = new DoctorSpecifications()
            {
                Criteria = doctor => doctor.ApprovalStatus == DoctorApprovalStatus.Approved &&

                doctor.DoctorClinics.Any(dc => !dc.Clinic.IsDeleted) &&

                (doctorName == null || EF.Functions.Like(doctor.FirstName + " " + doctor.LastName,
                                                         $"%{doctorName}%")) &&

                (!medicalSpecialtyId.HasValue || doctor.MedicalSpecialtyId == medicalSpecialtyId.Value) &&

                (!governorateId.HasValue || doctor.DoctorClinics.Any(dc => !dc.Clinic.IsDeleted && dc.Clinic.Region.GovernorateId == governorateId.Value)) &&
                (!regionId.HasValue || doctor.DoctorClinics.Any(dc => !dc.Clinic.IsDeleted && dc.Clinic.RegionId == regionId.Value))
            };

            specification.OrderBy = doctor => doctor.FirstName;
            specification.ThenBy = doctor => doctor.LastName;

            if (applyPagination)
            {
                specification.IsPaginationEnabled = true;
                specification.Skip = (pageIndex - 1) * pageSize;
                specification.Take = pageSize;
                specification.Includes.Add(doctor => doctor.MedicalSpecialty);
            }

            return specification;
        }
    }
}
