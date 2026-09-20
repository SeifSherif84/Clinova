using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Appointments
{
    public class PatientAppointmentResponse
    {
        public int AppointmentId { get; set; }

        public string DoctorName { get; set; } = null!;
        public string ClinicName { get; set; } = null!;

        public DateOnly AppointmentSlotDate { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }

        public string AppointmentStatus { get; set; } = null!;
        public string PaymentStatus { get; set; } = null!;

        public DateTime ReservationExpiresAt { get; set; }
    }
}
