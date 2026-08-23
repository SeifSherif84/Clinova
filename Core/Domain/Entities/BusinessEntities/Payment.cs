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
        public decimal TotalAmount { get; set; }
        public decimal DepositAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal RemainingAmount => TotalAmount - PaidAmount;
        public string TransactionReference { get; set; } = null!;
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;


        public int AppointmentId { get; set; }
        public Appointment Appointment { get; set; } = null!;

        public int PaymentMethodId { get; set; }
        public PaymentMethod PaymentMethod { get; set; } = null!;
    }
}
