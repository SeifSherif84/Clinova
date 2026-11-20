using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.SupportTickets
{
    public class SupportTicketMessageResponse
    {
        public int Id { get; set; }
        public string SenderId { get; set; } = null!;
        public string Message { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
    }
}
