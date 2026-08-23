using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.BusinessEntities
{
    public class DoctorClinic 
    {
        public string DoctorId { get; set; } = null!;
        public Doctor Doctor { get; set; } = null!;

        public int ClinicId { get; set; }
        public Clinic Clinic { get; set; } = null!;

        public ICollection<WorkingHours> WorkingHours { get; set; } = new List<WorkingHours>();

        public bool IsOwner { get; set; } = false;
    }
}
