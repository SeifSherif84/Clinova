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
    public class SubmitManualPaymentProofRequest
    {
        [Required]
        [Range(1, int.MaxValue)]
        public int ClinicManualPaymentMethodId { get; set; }


        [Required]
        [AllowedImage]
        public IFormFile PaymentProof { get; set; } = null!;


        [StringLength(200)]
        public string? TransactionReference { get; set; }
    }
}
