using Domain.Entities;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Contracts;
using Domain.Entities.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Persistence.Data.Configurations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Reflection.Emit;
using System.Text;
using System.Threading.Tasks;

namespace Persistence.Data.Contexts
{
    public class AppDbContext : IdentityDbContext<UserApp>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {

        }


        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

            builder.Entity<IdentityRole>().ToTable("Roles");
            builder.Entity<IdentityUserRole<string>>().ToTable("UserRoles");
            builder.Entity<IdentityUserClaim<string>>().ToTable("UserClaims");
            builder.Entity<IdentityUserLogin<string>>().ToTable("UserLogins");
            builder.Entity<IdentityRoleClaim<string>>().ToTable("RoleClaims");
            builder.Entity<IdentityUserToken<string>>().ToTable("UserTokens");

            //foreach (var entityType in builder.Model.GetEntityTypes())
            //{
            //    if (entityType.BaseType == null && typeof(ISoftDelete).IsAssignableFrom(entityType.ClrType))
            //        builder.Entity(entityType.ClrType).HasQueryFilter(GetIsDeletedRestriction(entityType.ClrType));
            //}


            //static LambdaExpression GetIsDeletedRestriction(Type type)
            //{
            //    ParameterExpression parameter = Expression.Parameter(type, "entity");
            //    MemberExpression property = Expression.Property(parameter, nameof(ISoftDelete.IsDeleted));
            //    ConstantExpression falseConstant = Expression.Constant(false);
            //    BinaryExpression condition = Expression.Equal(property, falseConstant);
            //    LambdaExpression lamdaCondition = Expression.Lambda(condition, parameter);
            //    return lamdaCondition;
            //}

            builder.Entity<UserApp>().HasQueryFilter(user => !user.IsDeleted);
            builder.Entity<Clinic>().HasQueryFilter(clinic => !clinic.IsDeleted);
        }

        public DbSet<Doctor> Doctors { get; set; }
        public DbSet<Patient> Patients { get; set; }
        public DbSet<Secretary> Secretaries { get; set; }

        public DbSet<Governorate> Governorates { get; set; }
        public DbSet<Region> Regions { get; set; }
        public DbSet<MedicalSpecialty> MedicalSpecialties { get; set; }

        public DbSet<Clinic> Clinics { get; set; }
        public DbSet<ClinicPhoneNumbers> ClinicPhoneNumbers { get; set; }
        public DbSet<ClinicImages> ClinicImages { get; set; }
        public DbSet<DoctorClinic> DoctorClinics { get; set; }

        public DbSet<WorkingHours> WorkingHours { get; set; }
        public DbSet<AvailableSlots> AvailableSlots { get; set; }

        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<Prescription> Prescriptions { get; set; }
        public DbSet<Review> Reviews { get; set; }

        public DbSet<PaymentMethod> PaymentMethods { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Invitation> Invitations { get; set; }
        public DbSet<Notification> Notifications { get; set; }
    }
}
