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
        [EnumDataType(typeof(ManualRefundMethod))]
        public ManualRefundMethod ManualRefundMethod { get; set; }


        [AllowedImage]
        public IFormFile? ManualRefundProof { get; set; }


        [StringLength(100)]
        public string? ManualRefundTransactionReference { get; set; }
    }
}
