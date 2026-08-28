using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Doctors
{
    public class DoctorProfileResponse
    {
        // Basic Information
        public string Id { get; set; } = null!;
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string PhoneNumber { get; set; } = null!;
        public string? ProfilePicture { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public Gender? Gender { get; set; }

        // Professional Information
        public string? Title { get; set; }
        public int? ExperienceYears { get; set; }
        public string? Bio { get; set; }

        // Medical Specialty
        public int MedicalSpecialtyId { get; set; }
        public string MedicalSpecialtyName { get; set; } = null!;

        // Verification / Approval
        public string ApprovalStatusName { get; set; } = null!;

        // Registration / Verification Documents
        public string SyndicateNumber { get; set; } = null!;
        public string SyndicateCardImageUrl { get; set; } = null!;
        public string NationalIdImageUrl { get; set; } = null!;
    }
}
