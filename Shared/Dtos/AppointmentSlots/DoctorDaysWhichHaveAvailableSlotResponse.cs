using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.AppointmentSlots
{
    public class DoctorDaysWhichHaveAvailableSlotResponse
    {
        public string DayName { get; set; } = null!;
        public DateOnly Date { get; set; }
    }
}
