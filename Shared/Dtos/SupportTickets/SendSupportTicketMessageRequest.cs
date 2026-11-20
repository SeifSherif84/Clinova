using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.SupportTickets
{
    public class SendSupportTicketMessageRequest
    {
        [Required]
        [StringLength(3000, MinimumLength = 1)]
        public string Message { get; set; } = null!;
    }
}
