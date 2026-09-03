using Microsoft.AspNetCore.SignalR;
using Services.Abstractions.Notifications;
using Shared.Dtos.Notifications;
using Web.Hubs;

namespace Web.SignalR
{
    public class NotificationPublisher(IHubContext<NotificationHub> _hubContext) : INotificationPublisher
    {
        public async Task SendNotificationAsync(string notificationReceiverId, NotificationResponse notification)
        {
            await _hubContext.Clients.User(notificationReceiverId).SendAsync("ReceiveNotification", notification);
        }
    }
}
