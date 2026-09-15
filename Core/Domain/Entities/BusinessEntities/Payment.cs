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

        // Payment Method
        public int? ClinicPaymentMethodId { get; set; }
        public ClinicPaymentMethod? ClinicPaymentMethod { get; set; } = null!;

        // Appointment
        public int AppointmentId { get; set; }
        public Appointment Appointment { get; set; } = null!;
    }
}