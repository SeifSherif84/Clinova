using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Doctors
{
    public class DoctorResponseForPatient
    {
        public string DoctorId { get; set; } = null!;
        public string DoctorName { get; set; } = null!;
        public string MedicalSpecialtyName { get; set; } = null!;
        public int? ExperienceYears { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public double? AverageRating { get; set; }
    }
}
