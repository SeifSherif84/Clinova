using Microsoft.AspNetCore.SignalR.Client;
using Shared.Dtos.Notifications;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory.Database;

namespace SignalR.TestClient
{
    internal class Program
    {
        static async Task Main(string[] args)
        {
            var notificationConnection = new HubConnectionBuilder()
            .WithUrl("https://localhost:7269/hubs/notifications", options =>
            {
                options.AccessTokenProvider = () => Task.FromResult("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjRjYzRlYmYyLWZmNjAtNGJkMy04NmU3LTY0NTg1NzRlNTI4YyIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6InNlaWYyNzE2OEBnbWFpbC5jb20iLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9naXZlbm5hbWUiOiJTZWlmIFNoZXJpZiIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkRvY3RvciIsImV4cCI6MTc4ODQxNTE3NSwiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NzI2OSIsImF1ZCI6IkNsaW5vdmEifQ.qYoh19ORNF7GmFSXBg8AgiIFlVrmLlL-nNN8UoXYksg");
            })
            .WithAutomaticReconnect()
            .Build();


            notificationConnection.On<NotificationResponse>(
            "ReceiveNotification",
            notification =>
            {
                Console.WriteLine($"Title: {notification.Title}");
                Console.WriteLine($"Message: {notification.Message}");
                Console.WriteLine($"Type: {notification.Type}");
            });


            await notificationConnection.StartAsync();

            Console.WriteLine("Connected to NotificationHub.");

            Console.ReadLine();
        }
    }
}
