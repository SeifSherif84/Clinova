using Domain.Entities.Common;
using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.BusinessEntities
{
    public class ClinicPaymentMethod : BaseEntity<int>
    {
        // Payment Method Configuration
        public PaymentMethodType Type { get; set; }
        public bool IsActive { get; set; } = true;

        // Manual Payment Information
        public string? AccountIdentifier { get; set; }

        // Online Payment Gateway Information
        public string? Provider { get; set; }
        public string? ProviderAccountId { get; set; }

        public int ClinicId { get; set; }
        public Clinic Clinic { get; set; } = null!;

        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }
}
