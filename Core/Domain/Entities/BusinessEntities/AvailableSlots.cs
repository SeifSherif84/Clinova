using Domain.Entities.Common;
using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.BusinessEntities
{
    public class AvailableSlots : BaseEntity<int>
    {
        public DateOnly Date { get; set; }
        public DayOfWeek Day { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public SlotStatus Status { get; set; } = SlotStatus.Available;

        public int WorkingHoursId { get; set; }
        public WorkingHours WorkingHours { get; set; } = null!;

        public Appointment? Appointment { get; set; }
    }
}
