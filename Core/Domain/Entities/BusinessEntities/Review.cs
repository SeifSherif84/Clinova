using Domain.Entities.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.BusinessEntities
{
    public class Review : BaseEntity<int>
    {
        public int Rating { get; set; } 
        public string? Comment { get; set; } = null!;
        public bool IsApproved { get; set; } = false;
        public bool IsAnonymous { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? ReplyContent { get; set; }

        public int AppointmentId { get; set; }
        public Appointment Appointment { get; set; } = null!;
    }
}
