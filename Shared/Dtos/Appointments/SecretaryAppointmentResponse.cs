using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Appointments
{
    public class SecretaryAppointmentResponse
    {
        public int AppointmentId { get; set; }

        public DateOnly SlotDate { get; set; }
        public TimeOnly SlotStartTime { get; set; }
        public TimeOnly SlotEndTime { get; set; }

        public string AppointmentStatus { get; set; } = null!;
        public string DoctorName { get; set; } = null!;
        public string PatientName { get; set; } = null!;

        public string PaymentStatus { get; set; } = null!;
        public string PaymentCategory { get; set; } = null!;

        public bool RequiresManualRefundAction { get; set; }
    }
}
