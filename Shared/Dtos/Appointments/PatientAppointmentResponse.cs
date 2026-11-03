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

        // Doctor & Clinic
        public string DoctorName { get; set; } = null!;
        public string ClinicName { get; set; } = null!;

        // Appointment Slot
        public DateOnly SlotDate { get; set; }
        public TimeOnly SlotStartTime { get; set; }
        public TimeOnly SlotEndTime { get; set; }

        // Appointment Status
        public string AppointmentStatus { get; set; } = null!;

        // Deposit Payment
        public decimal DepositAmount { get; set; }
        public string DepositPaymentStatus { get; set; } = null!;

        // Refund
        public string? DepositRefundStatus { get; set; }
        public decimal? RequestedDepositRefundAmount { get; set; }

        // Reservation
        public DateTime? ReservationExpiresAt { get; set; }
    }
}
