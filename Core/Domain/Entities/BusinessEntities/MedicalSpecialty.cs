using Domain.Entities.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.BusinessEntities
{
    public class MedicalSpecialty : BaseEntity<int>
    {
        public string Name { get; set; } = null!;
        public string? IconUrl { get; set; }

        public ICollection<Doctor> Doctors { get; set; } = new List<Doctor>();
    }
}
