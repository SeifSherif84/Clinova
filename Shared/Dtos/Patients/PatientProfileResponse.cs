using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Patients
{
    public class PatientProfileResponse
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

        // Medical Information
        public BloodTypes? BloodType { get; set; }
    }
}
