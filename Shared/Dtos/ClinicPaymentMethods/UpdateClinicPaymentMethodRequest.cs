using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.ClinicPaymentMethods
{
    public class UpdateClinicPaymentMethodRequest
    {
        [MaxLength(100)]
        public string? AccountIdentifier { get; set; }


        [MaxLength(100)]
        public string? Provider { get; set; }

        [MaxLength(200)]
        public string? ProviderAccountId { get; set; }
    }
}
