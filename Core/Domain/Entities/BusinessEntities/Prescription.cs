using Domain.Entities.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.BusinessEntities
{
    public class Prescription : BaseEntity<int>
    {
        public string Diagnosis { get; set; } = null!;
        public string TreatmentDetails { get; set; } = null!;
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int AppointmentId { get; set; }
        public virtual Appointment Appointment { get; set; } = null!;
    }
}
