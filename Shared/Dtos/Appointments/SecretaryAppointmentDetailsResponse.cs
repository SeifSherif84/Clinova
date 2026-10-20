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


        // Payment
        public string PaymentStatus { get; set; } = null!;

        // Online or Manual
        public string PaymentCategory { get; set; } = null!;

        // Paymob, ManualTransfer, CashAtClinic
        public string PaymentMethodType { get; set; } = null!;

        // The specific clinic-configured manual payment method
        public string? ClinicManualPaymentMethodType { get; set; }

        public string? PaymentSecretaryRejectionReason { get; set; }
        public decimal PaymentAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public string? ManualPaymentProofUrl { get; set; }
        public string? PaymentTransactionReference { get; set; }


        // Refund
        public string? RefundStatus { get; set; }
        public decimal? RefundAmount { get; set; }
        public string? RefundMethod { get; set; }
        public string? RefundReason { get; set; }
        public string? RefundProcessedAt { get; set; }
        public string? ManualRefundProofUrl { get; set; }
        public string? ManualRefundTransactionReference { get; set; }
    }

}
