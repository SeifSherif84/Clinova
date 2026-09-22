using Domain.Entities.Common;
using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.BusinessEntities
{
    public class Payment : BaseEntity<int>
    {
        // Payment Amount
        public decimal Amount { get; set; }


        // Payment Information
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
        public DateTime? PaidAt { get; set; }
        public string? PaymentProofUrl { get; set; }


        // Transaction Information
        public string? TransactionReference { get; set; }


        // Paymob Information

        // Paymob Intention ID
        public string? ProviderPaymentIntentId { get; set; }

        // Paymob Order ID
        public string? ProviderOrderId { get; set; }

        // Paymob Client Secret
        public string? ProviderClientSecret { get; set; }

        // Paymob Transaction ID
        public string? ProviderTransactionId { get; set; }


        // Manual Payment Method
        public int? ClinicManualPaymentMethodId { get; set; }
        public ClinicManualPaymentMethod? ClinicManualPaymentMethod { get; set; }


        // Online Payment Account
        public int? ClinicOnlinePaymentAccountId { get; set; }
        public ClinicOnlinePaymentAccount? ClinicOnlinePaymentAccount { get; set; }


        // Appointment
        public int AppointmentId { get; set; }
        public Appointment Appointment { get; set; } = null!;


        public PaymentRefund? Refund { get; set; }


        public byte[] RowVersion { get; set; } = null!;
    }
}