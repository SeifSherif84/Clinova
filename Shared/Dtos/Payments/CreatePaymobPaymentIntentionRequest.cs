using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Payments
{
    public class CreatePaymobPaymentIntentionRequest
    {
        [Required]
        public OnlinePaymentMethod PaymentMethod { get; set; }
    }
}
