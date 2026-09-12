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
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

        // Transaction Information
        public string? TransactionReference { get; set; }

        // Payment Method
        public int ClinicPaymentMethodId { get; set; }
        public ClinicPaymentMethod ClinicPaymentMethod { get; set; } = null!;

        // Appointment
        public int AppointmentId { get; set; }
        public Appointment Appointment { get; set; } = null!;
    }
}