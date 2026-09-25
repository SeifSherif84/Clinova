using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Paymob
{
    public class PaymentConfigurationStatusResponse
    {
        public string Provider { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string? IssueCode { get; set; }
        public DateTime? LastIssueAt { get; set; }
        public string Message { get; set; } = null!;
    }
}
