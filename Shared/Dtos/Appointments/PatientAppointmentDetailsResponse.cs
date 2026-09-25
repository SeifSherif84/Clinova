using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Appointments
{
    public class PatientAppointmentDetailsResponse
    {
        public int AppointmentId { get; set; }

        public string DoctorId { get; set; } = null!;
        public string DoctorName { get; set; } = null!;

        public int ClinicId { get; set; }
        public string ClinicName { get; set; } = null!;

        public DateTime BookingDate { get; set; }

        public DateOnly AppointmentSlotDate { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }

        public string AppointmentStatus { get; set; } = null!;

        public string? PatientNotes { get; set; }

        public decimal ConsultationFee { get; set; }
        public decimal DepositAmount { get; set; }
        public decimal RemainingAmount { get; set; }

        public string PaymentStatus { get; set; } = null!;

        public DateTime ReservationExpiresAt { get; set; }


        // Cancellation & Refund Policy Snapshot
        public int FullRefundCancellationWindowMinutes { get; set; }
        public int BookingCancellationGracePeriodMinutes { get; set; }
    }
}
