using Domain.Entities.Identity;
using Microsoft.AspNetCore.Identity;
using Shared.Dtos.Error;
using System.Security.Claims;

namespace Web.Middleware
{
    public class ValidateUserStatusMiddleware(UserManager<UserApp> _userManager) : IMiddleware
    {
        public async Task InvokeAsync(HttpContext context, RequestDelegate _next)
        {
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!string.IsNullOrWhiteSpace(userId)) {
                    var user = await _userManager.FindByIdAsync(userId);
                    if (user is null || user.IsDeleted)
                    {
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        context.Response.ContentType = "application/json";
                        var responseBody = new ErrorResponse()
                        {
                            StatusCode = StatusCodes.Status401Unauthorized,
                            Title = "Unauthorized",
                            Message = "Your account is no longer active."
                        };
                        await context.Response.WriteAsJsonAsync(responseBody);
                        return;
                    }
                }
            }
            await _next.Invoke(context);
        }
    }
}
