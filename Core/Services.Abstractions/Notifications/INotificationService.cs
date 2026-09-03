using Domain.Entities.Enums;
using Shared.Dtos.Notifications;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.Notifications
{
    public interface INotificationService
    {
        Task<IEnumerable<NotificationResponse>> GetNotificationsAsync(string userId);
        Task MarkAsReadAsync(string userId, int notificationId);
        Task MarkAllAsReadAsync(string userId);
        Task CreateAndSendAsync(string notificationReceiverId, string title, string message, NotificationType notificationType);
    }
}
