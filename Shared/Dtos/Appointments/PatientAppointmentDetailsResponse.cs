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

        // Doctor & Clinic
        public string DoctorName { get; set; } = null!;
        public string ClinicName { get; set; } = null!;


        // Appointment
        public DateTime BookingDate { get; set; }
        public string BookingSource { get; set; } = null!;
        public string BookingType { get; set; } = null!;
        public DateOnly SlotDate { get; set; }
        public TimeOnly SlotStartTime { get; set; }
        public TimeOnly SlotEndTime { get; set; }
        public string AppointmentStatus { get; set; } = null!;
        public DateTime? ReservationExpiresAt { get; set; }


        // Financial Information
        public decimal ConsultationFee { get; set; }
        public decimal TotalPaidAmount { get; set; }


        // Deposit Payment
        public decimal DepositAmount { get; set; }
        public string DepositPaymentStatus { get; set; } = null!;
        public string? DepositPaymentMethodType { get; set; } // Paymob, ManualTransfer, CashAtClinic
        public string? DepositClinicManualPaymentMethodType { get; set; } // The specific clinic-configured manual payment method
        public string? ManualDepositPaymentProofUrl { get; set; }
        public string? DepositPaymentTransactionReference { get; set; }
        public string? DepositPaymentRejectionReason { get; set; }


        // Remaining Payment
        public decimal RemainingAmount { get; set; }
        public string? RemainingPaymentStatus { get; set; }
        public string? RemainingPaymentMethodType { get; set; }
        public string? RemainingClinicManualPaymentMethodType { get; set; }


        // Deposit Refund
        public decimal? RequestedDepositRefundAmount { get; set; }
        public string? DepositRefundStatus { get; set; }
        public string? DepositRefundMethodType { get; set; }
        public string? DepositRefundReason { get; set; }
        public DateTime? DepositRefundRequestedAt { get; set; }
        public DateTime? DepositRefundProcessedAt { get; set; }
        public string? ManualDepositRefundProofUrl { get; set; }
        public string? ManualDepositRefundTransactionReference { get; set; }


        // Cancellation & Refund Policy Snapshot
        public int? FullRefundCancellationWindowMinutes { get; set; }
        public int? BookingCancellationGracePeriodMinutes { get; set; }
    }
}
