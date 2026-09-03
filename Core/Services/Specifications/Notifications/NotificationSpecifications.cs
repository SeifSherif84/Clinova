using Domain.Contracts;
using Domain.Entities.BusinessEntities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Specifications.Notifications
{
    public class NotificationSpecifications : BaseSpecifications<Notification, int>
    {
        // Contructor to get all notifications or only unread notifications for a specific user
        public NotificationSpecifications(string userId, bool onlyUnread = false) : base()
        {
            if (onlyUnread)
                ApplyCriteriaToGetUnreadNotificationsForSpecificUser(userId);
            else
                ApplyCriteriaToGetNotificationsForSpeceficUser(userId);
        }

        private void ApplyCriteriaToGetNotificationsForSpeceficUser(string userId)
        {
            Criteria = noti => noti.UserAppId == userId;
        }
        private void ApplyCriteriaToGetUnreadNotificationsForSpecificUser(string userId)
        {
            Criteria = noti => noti.UserAppId == userId && !noti.IsRead;
        }




        // Constructor to get a specific notification by its ID
        public NotificationSpecifications(int notificationId) : base()
        {
            ApplyCriteriaToGetNotificationWithSpecificId(notificationId);
        }
        private void ApplyCriteriaToGetNotificationWithSpecificId(int notificationId)
        {
            Criteria = noti => noti.Id == notificationId;
        }

    }
}
