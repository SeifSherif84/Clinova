using Domain.Entities.Common;
using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.BusinessEntities
{
    public class Appointment : BaseEntity<int>
    {
        public DateTime BookingDate { get; set; } = DateTime.UtcNow;
        public AppointmentStatus Status { get; set; } = AppointmentStatus.Pending;
        public string? PatientNotes { get; set; }
        public string? DoctorNotes { get; set; }

        public string PatientId { get; set; } = null!;
        public Patient Patient { get; set; } = null!;

        public int AvailableSlotId { get; set; }
        public  AvailableSlots AvailableSlot { get; set; } = null!;

        public Payment? Payment { get; set; }
        public Review? Review { get; set; }
        public Prescription? Prescription { get; set; }
    }
}
