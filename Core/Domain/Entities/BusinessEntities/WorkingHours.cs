using Domain.Entities.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.BusinessEntities
{
    public class WorkingHours : BaseEntity<int>
    {
        public DayOfWeek Day { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public int SlotDurationMinutes { get; set; }

        
        public string DoctorId { get; set; } = null!;
        public int ClinicId { get; set; }
        public DoctorClinic DoctorClinic { get; set; } = null!;

        public ICollection<AvailableSlots> AvailableSlots { get; set; } = new List<AvailableSlots>();
    }
}
