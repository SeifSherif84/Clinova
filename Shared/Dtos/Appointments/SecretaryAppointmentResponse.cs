using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Appointments
{
    public class SecretaryAppointmentResponse
    {
        public int Id { get; set; }

        public DateOnly SlotDate { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }

        public string AppointmentStatus { get; set; } = null!;
        public string DoctorName { get; set; } = null!;
        public string PatientName { get; set; } = null!;
        public string PaymentStatus { get; set; } = null!;
        public string PaymentType { get; set; } = null!;
    }
}
