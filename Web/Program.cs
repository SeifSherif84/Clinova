using Domain.Contracts;
using Domain.Entities.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Persistence.Data.Contexts;
using Persistence.Data.DataSeeding;
using Persistence.UnitOfWork;
using Services;
using Services.Abstractions;
using Services.AutoMapping.Auth;
using Services.AutoMapping.Doctors;
using Services.MailKitFeature;
using Store.G02.Shared;
using System.Text;
using Web.Middleware;

namespace Web
{
    public class Program
    {
        public async static Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllers();
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
            });

            builder.Services.AddTransient<GlobalErrorHandlingMiddleware>();
            builder.Services.AddTransient<ValidateUserStatusMiddleware>();

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

            app.UseAuthentication();

            app.UseMiddleware<ValidateUserStatusMiddleware>();

            app.UseAuthorization();

            app.MapControllers();


            app.Run();
        }
    }
}
