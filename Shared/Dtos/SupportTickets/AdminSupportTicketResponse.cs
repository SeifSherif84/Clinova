using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.SupportTickets
{
    public class AdminSupportTicketResponse
    {
        public int Id { get; set; }
        public string PatientId { get; set; } = null!;
        public string PatientName { get; set; } = null!;
        public string Category { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string OriginalMessage { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
    }
}
