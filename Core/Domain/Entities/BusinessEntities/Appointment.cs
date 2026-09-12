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
        // Booking Information
        public DateTime BookingDate { get; set; } = DateTime.UtcNow;

        // Appointment Status
        public AppointmentStatus Status { get; set; } = AppointmentStatus.PendingPayment;

        // Appointment Notes
        public string? PatientNotes { get; set; }
        public string? DoctorNotes { get; set; }

        // Patient
        public string PatientId { get; set; } = null!;
        public Patient Patient { get; set; } = null!;

        // Appointment Slot
        public int AppointmentSlotId { get; set; }
        public AppointmentSlot AppointmentSlot { get; set; } = null!;

        // Financial Snapshot
        public decimal ConsultationFee { get; set; }
        public decimal DepositAmount { get; set; }
        public decimal RemainingAmount { get; set; }

        // Payment
        public Payment? Payment { get; set; }

        // Appointment Related Data
        public Review? Review { get; set; }
        public Prescription? Prescription { get; set; }
    }
}