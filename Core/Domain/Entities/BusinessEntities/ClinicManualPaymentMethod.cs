using Domain.Entities.Common;
using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.BusinessEntities
{
    public class ClinicManualPaymentMethod : BaseEntity<int>
    {
        public ManualPaymentMethodType Type { get; set; }

        public string AccountIdentifier { get; set; } = null!;

        public bool IsActive { get; set; } = true;

        public int ClinicId { get; set; }
        public Clinic Clinic { get; set; } = null!;

        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }
}
