using Domain.Entities.Common;
using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;


namespace Domain.Entities.BusinessEntities
{
    public class RemainingPayment : BaseEntity<int>
    {
        // Amount required for this remaining payment
        public decimal RequiredAmount { get; set; }


        // Payment Information
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public RemainingPaymentMethodType? MethodType { get; set; }
        public RemainingPaymentStatus Status { get; set; } = RemainingPaymentStatus.Pending;
        public DateTime? PaidAt { get; set; }


        // Manual Payment Method
        public int? ClinicManualPaymentMethodId { get; set; }
        public ClinicManualPaymentMethod? ClinicManualPaymentMethod { get; set; }


        // Appointment
        public int AppointmentId { get; set; }
        public Appointment Appointment { get; set; } = null!;


        public byte[] RowVersion { get; set; } = null!;
    }
}
