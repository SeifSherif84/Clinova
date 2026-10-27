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

        public BookingSource BookingSource { get; set; }
        public BookingType BookingType { get; set; }


        // Appointment Status
        public AppointmentStatus Status { get; set; } = AppointmentStatus.PendingPayment;
        public DateTime ReservationExpiresAt { get; set; }


        //// Appointment Notes
        //public string? PatientNotes { get; set; }
        //public string? DoctorNotes { get; set; }


        // Financial Snapshot
        public decimal ConsultationFee { get; set; }
        //public decimal RequiredDepositAmount { get; set; }
        public decimal TotalPaidAmount { get; set; }
        //public decimal RequiredRemainingAmount { get; set; }


        // Cancellation & Refund Policy Snapshot for patient appointment not guest reservation
        public int? FullRefundCancellationWindowMinutes { get; set; }
        public int? BookingCancellationGracePeriodMinutes { get; set; }


        // Patient
        public string? PatientId { get; set; }
        public Patient? Patient { get; set; }

        // Guest Patient Information
        public string? GuestPatientName { get; set; }
        public string? GuestPatientPhone { get; set; }


        // Appointment Slot
        public int AppointmentSlotId { get; set; }
        public AppointmentSlot AppointmentSlot { get; set; } = null!;


        // Deposit Payment
        public DepositPayment DepositPayment { get; set; } = null!;
        public RemainingPayment? RemainingPayment { get; set; }


        // Appointment Related Data
        public Review? Review { get; set; }
        public Prescription? Prescription { get; set; }


        // Optimistic Concurrency
        public byte[] RowVersion { get; set; } = null!;
    }
}