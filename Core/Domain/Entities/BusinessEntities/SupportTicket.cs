using Domain.Entities.Enums;
using Domain.Entities.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.BusinessEntities
{
    public class SupportTicket
    {
        public int Id { get; set; }

        public string UserAppId { get; set; } = null!;
        public UserApp UserApp { get; set; } = null!;

        public string OriginalMessage { get; set; } = null!;

        public SupportTicketCategory Category { get; set; }
        public SupportTicketStatus Status { get; set; } = SupportTicketStatus.Open;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<SupportTicketMessage> Messages { get; set; } = new List<SupportTicketMessage>();
    }
}
