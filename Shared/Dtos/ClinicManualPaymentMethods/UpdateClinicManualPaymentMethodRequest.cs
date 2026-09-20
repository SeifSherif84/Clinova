using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.ClinicManualPaymentMethods
{
    public class UpdateClinicManualPaymentMethodRequest
    {
        [Required]
        [MaxLength(100)]
        public string AccountIdentifier { get; set; } = null!;
    }
}
