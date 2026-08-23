using Domain.Entities.Common;
using Domain.Entities.Enums;
using Domain.Entities.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.BusinessEntities
{
    public class Notification : BaseEntity<int>
    {
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
        public NotificationType? Type { get; set; }
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public string UserAppId { get; set; } = null!;
        public UserApp UserApp { get; set; } = null!;
    }
}
