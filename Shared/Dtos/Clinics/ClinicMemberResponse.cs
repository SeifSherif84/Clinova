using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Clinics
{
    public class ClinicMemberResponse
    {
        public string Id { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string? ProfilePicture { get; set; }
        public string? Title { get; set; }
        public int? ExperienceYears { get; set; }
        public string MedicalSpecialty { get; set; } = null!;
        public bool IsOwner { get; set; }
        public DateTime JoinedAt { get; set; }
    }
}
