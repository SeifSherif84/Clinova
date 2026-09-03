using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Presentation.Controllers.Notifications
{
    [ApiController]
    [Route("api/notifications")]
    public class NotificationsController(IServiceManager _serviceManager) : ControllerBase
    {
        [Authorize]
        [HttpGet] // Get api/notifications
        public async Task<IActionResult> GetNotifications()
        {
            var userId = HttpContext.User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
            var response = await _serviceManager.NotificationService.GetNotificationsAsync(userId ?? string.Empty);
            return Ok(response);
        }


        [Authorize]
        [HttpPost("{notificationId}/mark-as-read")] // Post api/notifications/{notificationId}/mark-as-read
        public async Task<IActionResult> MarkAsRead(int notificationId)
        {
            var userId = HttpContext.User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
            await _serviceManager.NotificationService.MarkAsReadAsync(userId ?? string.Empty, notificationId);
            return NoContent();
        }


        [Authorize]
        [HttpPost("mark-all-as-read")] // Post api/notifications/mark-all-as-read
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = HttpContext.User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
            await _serviceManager.NotificationService.MarkAllAsReadAsync(userId ?? string.Empty);
            return NoContent();
        }

    }
}
