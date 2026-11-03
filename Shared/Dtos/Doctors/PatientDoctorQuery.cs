using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Doctors
{
    public class PatientDoctorQuery
    {
        public string? DoctorName { get; set; }
        public int? MedicalSpecialtyId { get; set; }
        public int? GovernorateId { get; set; }
        public int? RegionId { get; set; }
        public int PageIndex { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
