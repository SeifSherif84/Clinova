using Domain.Entities.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.BusinessEntities
{
    public class PaymentMethod : BaseEntity<int>
    {
        public string Name { get; set; } = null!;
        public string? LogoUrl { get; set; }

        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }
}
