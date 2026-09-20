using Domain.Contracts;
using Domain.Entities.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Persistence.Data.Contexts;
using Persistence.Data.DataSeeding;
using Persistence.UnitOfWork;
using Services;
using Services.Abstractions;
using Services.Abstractions.Appointments;
using Services.Abstractions.AppointmentSlots;
using Services.Abstractions.DataProtection;
using Services.DataProtection;
using Services.Abstractions.Notifications;
using Services.Appointments;
using Services.AppointmentSlots;
using Services.AutoMapping.Appointments;
using Services.AutoMapping.AppointmentSlots;
using Services.AutoMapping.Auth;
using Services.AutoMapping.ClinicManualPaymentMethods;
using Services.AutoMapping.Clinics;
using Services.AutoMapping.Doctors;
using Services.AutoMapping.Invitations;
using Services.AutoMapping.Notifications;
using Services.AutoMapping.Patients;
using Services.AutoMapping.WorkingHours;
using Services.Background;
using Services.MailKitFeature;
using Services.Notifications;
using Services.Paymob;
using Shared.Dtos.Paymob;
using Shared.Dtos.Auth;
using System.Text;
using Web.Hubs;
using Web.Middleware;
using Web.SignalR;
using Domain.Entities.BusinessEntities;
using Services.AutoMapping.ClinicOnlinePaymentAccounts;
using Microsoft.Extensions.DependencyInjection;
using Services.Abstractions.Paymob;

namespace Web
{
    public class Program
    {
        public async static Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            const string FrontendCorsPolicy = "Frontend";

            // Add services to the container.

            builder.Services.AddControllers();

            builder.Services.AddCors(options =>
            {
                options.AddPolicy(FrontendCorsPolicy, policy =>
                {
                    var frontendUrl = builder.Configuration["FrontendBaseURL"] ?? "http://localhost:5173";

                    policy.WithOrigins(frontendUrl.TrimEnd('/'))
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                });
            });

            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();


            // UserDefined Services Start
            builder.Services.AddDbContext<AppDbContext>(DbContextOptions =>
            {
                DbContextOptions.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
            });


            builder.Services.AddIdentity<UserApp, IdentityRole>(identityOptions =>
            {
                identityOptions.User.RequireUniqueEmail = true;
            }).AddEntityFrameworkStores<AppDbContext>()
              .AddDefaultTokenProviders();
            

            builder.Services.AddAutoMapper(MapperConfig =>
            {
                MapperConfig.AddProfile(new AuthProfile());
                MapperConfig.AddProfile(new DoctorProfile(builder.Configuration));
                MapperConfig.AddProfile(new ClinicProfile(builder.Configuration));
                MapperConfig.AddProfile(new InvitationProfile());
                MapperConfig.AddProfile(new NotificationProfile());
                MapperConfig.AddProfile(new WorkingHourProfile());
                MapperConfig.AddProfile(new PatientProfile(builder.Configuration));
                MapperConfig.AddProfile(new ClinicManualPaymentMethodProfile());
                MapperConfig.AddProfile(new AppointmentSlotProfile());
                MapperConfig.AddProfile(new AppointmentProfile());
            });




            builder.Services.AddScoped<IDbInitializer, DbInitializer>();
            builder.Services.AddScoped<IMailService, MailService>();    
            builder.Services.AddScoped<IServiceManager, ServiceManager>();
            builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();


            builder.Services.Configure<MailKitSetting>(builder.Configuration.GetSection("MailKitSetting"));
            builder.Services.Configure<JWTOptions>(builder.Configuration.GetSection("JWTOptions"));


            var JWTOptions = builder.Configuration.GetSection("JWTOptions").Get<JWTOptions>();
            builder.Services.AddAuthentication(authConfig =>
            {
                authConfig.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                authConfig.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(jwtBearerConfig =>
            {
                jwtBearerConfig.TokenValidationParameters = new TokenValidationParameters()
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = JWTOptions?.Issuer,
                    ValidAudience = JWTOptions?.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JWTOptions?.SecurityKey ?? string.Empty)),
                    ClockSkew = TimeSpan.Zero
                };
                jwtBearerConfig.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        if (!string.IsNullOrEmpty(accessToken)
                            && context.HttpContext.Request.Path.StartsWithSegments("/hubs/notifications"))
                        {
                            context.Token = accessToken;
                        }

                        return Task.CompletedTask;
                    }
                };
            });

            builder.Services.AddTransient<GlobalErrorHandlingMiddleware>();
            builder.Services.AddTransient<ValidateUserStatusMiddleware>();

            builder.Services.AddScoped<INotificationService, NotificationService>();
            builder.Services.AddScoped<INotificationPublisher, NotificationPublisher>();    
            builder.Services.AddScoped<IAppointmentSlotService, AppointmentSlotService>();

            // For Background Service
            builder.Services.AddScoped<IAppointmentService, AppointmentService>();
            builder.Services.AddHostedService<AppointmentExpirationService>();

            builder.Services.AddSignalR();


            // For Paymob Integration Service
            builder.Services.Configure<PaymobSettings>(builder.Configuration.GetSection("PaymobSettings"));
            builder.Services.AddHttpClient<IPaymobService, PaymobService>();

            builder.Services.AddHttpClient<PaymobClient>((serviceProvider, client) =>
            {
                var settings = serviceProvider.GetRequiredService<IOptions<PaymobSettings>>().Value;
                client.BaseAddress = new Uri(settings.BaseUrl);
                client.Timeout = TimeSpan.FromSeconds(30);
            });



            builder.Services.AddScoped<IPaymentCredentialEncryptor, PaymentCredentialEncryptor>();
            builder.Services.AddScoped<IPaymobService, PaymobService>();
            builder.Services.AddScoped<IPaymobHmacService, PaymobHmacService>();

            // UserDefined Services End

            var app = builder.Build();


            using var scope = app.Services.CreateScope();
            var dbIntializer = scope.ServiceProvider.GetRequiredService<IDbInitializer>();
            await dbIntializer.InitializerAsync();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseStaticFiles();

            app.UseMiddleware<GlobalErrorHandlingMiddleware>();

            app.UseHttpsRedirection();

            app.UseRouting();

            app.UseCors(FrontendCorsPolicy);

            app.UseAuthentication();

            app.UseMiddleware<ValidateUserStatusMiddleware>();

            app.UseAuthorization();

            app.MapControllers();

            app.MapHub<NotificationHub>("/hubs/notifications");

            app.Run();
        }
    }
}
