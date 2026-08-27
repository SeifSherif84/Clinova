using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Doctors
{
    public class UpdateDoctorProfileRequest
    {
        [MaxLength(50)]
        public string? Title { get; set; }

        [Range(0, 100)]
        public int? ExperienceYears { get; set; }

        [MaxLength(1000)]
        public string? Bio { get; set; }

        public DateOnly? DateOfBirth { get; set; }

        public Gender? Gender { get; set; }
    }
}
