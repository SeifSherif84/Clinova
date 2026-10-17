using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.AppointmentSlots
{
    public class AvailableAppointmentSlotsExistInSpecificDateRequest
    {
        public DateOnly? Date { get; set; }
    }
}
