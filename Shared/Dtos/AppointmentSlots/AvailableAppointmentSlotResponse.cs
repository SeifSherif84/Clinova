using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.AppointmentSlots
{
    public class AvailableAppointmentSlotResponse
    {
        public int Id { get; set; }
        public DateOnly Date { get; set; }
        public string Day { get; set; } = null!;
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
    }
}
