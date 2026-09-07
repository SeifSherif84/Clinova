using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.WorkingHours
{
    public class UpdateWorkingHourRequest
    {
        public TimeOnly? StartTime { get; set; }
        public TimeOnly? EndTime { get; set; }

        [Range(1, 1440)]
        public int? SlotDurationMinutes { get; set; }
    }
}
