using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Patients
{
    public class UpdatePatientProfileRequest
    {
        [MaxLength(50)]
        [MinLength(1)]
        public string? FirstName { get; set; }

        [MaxLength(50)]
        [MinLength(1)]
        public string? LastName { get; set; }

        public DateOnly? DateOfBirth { get; set; }

        public Gender? Gender { get; set; }

        public BloodTypes? BloodType { get; set; }
    }
}
