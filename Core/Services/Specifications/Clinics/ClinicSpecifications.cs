using Domain.Entities.BusinessEntities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Specifications.Clinics
{
    public class ClinicSpecifications : BaseSpecifications<Clinic, int>
    {
        // Constructor to get a specific clinic by its ID, with optional includes for related entities
        public ClinicSpecifications(int clinicId, 
                                    bool includeImages = false,
                                    bool includePhoneNumbers = false,
                                    bool includeRegion = false) : base()
        {
            ApplyCriteriaToGetClinicWithSpecificId(clinicId);
            ApplyIncludes(includeImages, includePhoneNumbers, includeRegion);
        }

        private void ApplyCriteriaToGetClinicWithSpecificId(int clinicId)
        {
            Criteria = clinic => clinic.Id == clinicId;
        }




        // Constructor to get all clinics associated with a specific doctor, with optional includes for related entities
        public ClinicSpecifications(string userId,
                                    bool includeImages = false,
                                    bool includePhoneNumbers = false,
                                    bool includeRegion = false) : base()
        {
            ApplyCriteriaToGetClinicsForSpecificDoctor(userId);
            ApplyIncludes(includeImages, includePhoneNumbers, includeRegion);
        }

        private void ApplyCriteriaToGetClinicsForSpecificDoctor(string userId)
        {
            Criteria = clinic => clinic.DoctorClinics.Any(dc => dc.DoctorId == userId);
        }




        private void ApplyIncludes(bool includeImages,
                                   bool includePhoneNumbers,
                                   bool includeRegion)
        {
            if (includeImages) 
                Includes.Add(clinic => clinic.Images);
            if(includePhoneNumbers)
                Includes.Add(clinic => clinic.PhoneNumbers);
            if(includeRegion)
                Includes.Add(clinic => clinic.Region);
        }

    }
}
