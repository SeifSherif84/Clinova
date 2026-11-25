using Domain.Exceptions.AlreadyExist;
using Domain.Exceptions.BadRequest;
using Domain.Exceptions.Forbidden;
using Domain.Exceptions.InternalServerError;
using Domain.Exceptions.NotFound;
using Domain.Exceptions.Unauthorized;
using Shared.Dtos.Error;

namespace Web.Middleware
{
    public class GlobalErrorHandlingMiddleware : IMiddleware
    {
        public async Task InvokeAsync(HttpContext context, RequestDelegate next)
        {
            try
            {
                await next(context);
                if (context.GetEndpoint() is null && context.Response.StatusCode == StatusCodes.Status404NotFound)
                {
                    context.Response.ContentType = "application/json";
                    var ResponseBody = new ErrorResponse()
                    {
                        StatusCode = context.Response.StatusCode,
                        Title = "Not Found",
                        Message = $"Route '{context.Request.Path}' does not match any endpoint."
                    };
                    await context.Response.WriteAsJsonAsync(ResponseBody);
                }
            }

            catch (Exception exception)
            {
                var (statusCode, title, message) = exception switch
                {
                    BadRequestException => (StatusCodes.Status400BadRequest, "Bad Request", exception.Message),
                    UnauthorizedException => (StatusCodes.Status401Unauthorized, "Unauthorized", exception.Message),
                    ForbiddenException => (StatusCodes.Status403Forbidden, "Forbidden", exception.Message),
                    NotFoundException => (StatusCodes.Status404NotFound, "Not Found", exception.Message),
                    ConflictException => (StatusCodes.Status409Conflict, "Conflict", exception.Message),
                    InternalServerErrorException => (StatusCodes.Status500InternalServerError, "Internal Server Error", exception.Message),
                    _ => (StatusCodes.Status500InternalServerError, "Internal Server Error", "An unexpected error occurred.")
                };

                context.Response.StatusCode = statusCode;
                context.Response.ContentType = "application/json";

                var response = new ErrorResponse
                {
                    StatusCode = statusCode,
                    Title = title,
                    Message = message
                };
                await context.Response.WriteAsJsonAsync(response);
            }
        }
    }
}