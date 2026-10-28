using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Analytics
{

    public class DoctorPerformanceItemResponse
    {
        public string DoctorId { get; set; } = null!;
        public string DoctorName { get; set; } = null!;
        public int ConfirmedAppointments { get; set; }
        public int CompletedAppointments { get; set; }
        public decimal CollectedAmount { get; set; }
        public decimal ExpectedAmount { get; set; }
    }

}
