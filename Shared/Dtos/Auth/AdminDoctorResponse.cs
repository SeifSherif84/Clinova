using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Auth
{
    public class AdminDoctorResponse
    {
        public string DoctorId { get; set; } = null!;
        public string DoctorName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string PhoneNumber { get; set; } = null!;
        public string? ProfilePictureImageUrl { get; set; }
        public string SyndicateNumber { get; set; } = null!;
        public string SyndicateCardImageUrl { get; set; } = null!;
        public string NationalIdImageUrl { get; set; } = null!;
        public string MedicalSpecialty { get; set; } = null!;
        public string? Title { get; set; }
        public int? ExperienceYears { get; set; }
        public string? Bio { get; set; }
        public string ApprovalStatus { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
    }
}
