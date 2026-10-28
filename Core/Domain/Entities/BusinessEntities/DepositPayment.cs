using Domain.Entities.Common;
using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.BusinessEntities
{
    public class DepositPayment : BaseEntity<int>
    {
        // Amount required for this deposit payment
        public decimal RequiredAmount { get; set; }

        public DepositPaymentMethodType? MethodType { get; set; }


        // Payment Information
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DepositPaymentStatus Status { get; set; } = DepositPaymentStatus.Pending;
        public DateTime? PaidAt { get; set; }


        // Transaction Information
        public string? TransactionReference { get; set; }


        // Paymob Information
        public string? ProviderPaymentIntentId { get; set; }
        public string? ProviderOrderId { get; set; }
        public string? ProviderClientSecret { get; set; }
        public string? ProviderTransactionId { get; set; }


        // Manual Payment Method
        public int? ClinicManualPaymentMethodId { get; set; }
        public ClinicManualPaymentMethod? ClinicManualPaymentMethod { get; set; }
        public string? ManualProofUrl { get; set; }


        // Online Payment Account
        public int? ClinicOnlinePaymentAccountId { get; set; }
        public ClinicOnlinePaymentAccount? ClinicOnlinePaymentAccount { get; set; }


        // Appointment
        public int AppointmentId { get; set; }
        public Appointment Appointment { get; set; } = null!;


        public DepositRefund? DepositRefund { get; set; }


        public string? SecretaryRejectionReason { get; set; }


        public byte[] RowVersion { get; set; } = null!;
    }
}