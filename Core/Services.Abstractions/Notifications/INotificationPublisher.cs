using Shared.Dtos.Notifications;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.Notifications
{
    public interface INotificationPublisher
    {
        Task SendNotificationAsync(string notificationReceiverId, NotificationResponse notification);
    }
}
