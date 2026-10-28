using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Appointments
{
    public class SecretaryAppointmentDetailsResponse
    {
        public int AppointmentId { get; set; }

        // Appointment Slot
        public DateOnly SlotDate { get; set; }
        public TimeOnly SlotStartTime { get; set; }
        public TimeOnly SlotEndTime { get; set; }


        // Appointment
        public string AppointmentStatus { get; set; } = null!;
        public string BookingSource { get; set; } = null!;
        public string BookingType { get; set; } = null!;


        // Doctor
        public string DoctorName { get; set; } = null!;


        // Patient
        public string PatientName { get; set; } = null!;
        public string PatientPhoneNumber { get; set; } = null!;


        // Deposit Payment
        public decimal DepositPaymentAmount { get; set; }
        public string DepositPaymentStatus { get; set; } = null!;
        public string DepositPaymentMethodType { get; set; } = null!; // Paymob, ManualTransfer, CashAtClinic
        public string? DepositClinicManualPaymentMethodType { get; set; } // The specific clinic-configured manual payment method
        public string? ManualDepositPaymentProofUrl { get; set; }
        public string? DepositPaymentTransactionReference { get; set; }
        public string? DepositPaymentSecretaryRejectionReason { get; set; }


        // Remaining Payment
        public decimal RemainingPaymentAmount { get; set; }
        public string? RemainingPaymentStatus { get; set; }
        public string? RemainingPaymentMethodType { get; set; }
        public string? RemainingClinicManualPaymentMethodType { get; set; }


        // Total Paid Amount
        public decimal TotalPaidAmount { get; set; }


        // Refund
        public decimal? RequestedDepositRefundAmount { get; set; }
        public string? DepositRefundStatus { get; set; }
        public string? DepositRefundMethodType { get; set; }
        public string? DepositRefundReason { get; set; }
        public DateTime? DepositRefundProcessedAt { get; set; }
        public string? ManualDepositRefundProofUrl { get; set; }
        public string? ManualDepositRefundTransactionReference { get; set; }
    }

}
