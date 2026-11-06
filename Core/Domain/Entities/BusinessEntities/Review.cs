using Domain.Entities.Common;
using Domain.Entities.Enums;
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
        public string? Comment { get; set; }
        public ReviewStatus Status { get; set; } = ReviewStatus.Pending;
        public bool IsAnonymous { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int AppointmentId { get; set; }
        public Appointment Appointment { get; set; } = null!;
    }
}
