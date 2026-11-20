using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.SupportTickets
{
    public class PatientCreateSupportTicketRequest
    {
        [Required]
        [EnumDataType(typeof(SupportTicketCategory))]
        public SupportTicketCategory Category { get; set; }

        [Required]
        [StringLength(3000, MinimumLength = 10)]
        public string OriginalMessage { get; set; } = null!;
    }
}
