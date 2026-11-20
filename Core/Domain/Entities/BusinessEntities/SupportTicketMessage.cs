using Domain.Entities.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.BusinessEntities
{
    public class SupportTicketMessage
    {
        public int Id { get; set; }

        public int SupportTicketId { get; set; }
        public SupportTicket SupportTicket { get; set; } = null!;

        public string SenderId { get; set; } = null!;
        public UserApp Sender { get; set; } = null!; // Patient or Admin

        public string Message { get; set; } = null!; 

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
