using AutoMapper;
using Domain.Contracts;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Domain.Exceptions.BadRequest;
using Domain.Exceptions.Forbidden;
using Domain.Exceptions.InternalServerError;
using Domain.Exceptions.NotFound;
using Services.Abstractions.Notifications;
using Services.Specifications.Notifications;
using Shared.Dtos.Notifications;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Notifications
{
    public class NotificationService(IUnitOfWork _unitOfWork,
                                     IMapper _mapper,
                                     INotificationPublisher _notificationPublisher) : INotificationService
    {
        public async Task<IEnumerable<NotificationResponse>> GetNotificationsAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var notificationSpec = new NotificationSpecifications(userId);
            var notifications = await _unitOfWork.GetRepository<Notification, int>().GetAllAsync(notificationSpec);
            if (!notifications.Any())
                return Enumerable.Empty<NotificationResponse>();

            return _mapper.Map<IEnumerable<NotificationResponse>>(notifications);
        }



        public async Task MarkAsReadAsync(string userId, int notificationId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var notificationSpec = new NotificationSpecifications(notificationId);
            var notification = await _unitOfWork.GetRepository<Notification, int>().GetByIdAsync(notificationSpec);
            if (notification is null)
                throw new NotFoundException("We couldn't find the notification.");

            if(notification.UserAppId != userId)
                throw new ForbiddenException("You are not authorized to mark this notification as read.");

            if (notification.IsRead)
                return; 

            notification.IsRead = true;
            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException("We couldn't mark this notification as read right now.");
        }



        public async Task MarkAllAsReadAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var notificationSpec = new NotificationSpecifications(userId, onlyUnread:true);
            var notifications = await _unitOfWork.GetRepository<Notification, int>().GetAllAsync(notificationSpec);
            if (!notifications.Any())
                return;

            foreach (var notification in notifications)
            {
                notification.IsRead = true; 
            }

            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException("We couldn't mark all notifications as read right now.");
        }



        public async Task CreateAndSendAsync(string notificationReceiverId, string title, string message, NotificationType type)
        {
            var notification = new Notification
            {
                UserAppId = notificationReceiverId,
                Title = title,
                Message = message,
                Type = type
            };

            await _unitOfWork.GetRepository<Notification, int>().AddAsync(notification);

            var result = await _unitOfWork.SaveChangesAsync();

            if (result == 0)
                throw new InternalServerErrorException("We couldn't Create the notification right now.");

            var notificationResponse = _mapper.Map<NotificationResponse>(notification);

            await _notificationPublisher.SendNotificationAsync(notificationReceiverId, notificationResponse);
        }

    }
}
