using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.WorkingHours
{
    public class WorkingHoursResponse
    {
        public int Id { get; set; }
        public string Day { get; set; } = null!;
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public int SlotDurationMinutes { get; set; }
        public bool IsActive { get; set; }
    }
}
