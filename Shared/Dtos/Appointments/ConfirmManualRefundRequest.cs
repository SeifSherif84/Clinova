using Microsoft.AspNetCore.Http;
using Shared.Attributes;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Appointments
{
    public class ConfirmManualRefundRequest
    {
        [Required]
        [AllowedImage]
        public IFormFile ManualRefundProof { get; set; } = null!;


        [StringLength(100)]
        public string? ManualRefundTransactionReference { get; set; }
    }
}
