using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.ClinicPaymentMethods
{
    public class ClinicPaymentMethodResponseForOwner
    {
        public int Id { get; set; }
        public PaymentMethodType Type { get; set; }
        public bool IsActive { get; set; }

        public string? AccountIdentifier { get; set; }

        public string? Provider { get; set; }
        public string? ProviderAccountId { get; set; }
    }
}
