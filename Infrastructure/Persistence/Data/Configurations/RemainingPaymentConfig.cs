using Domain.Entities.BusinessEntities;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Persistence.Data.Configurations
{
    public class RemainingPaymentConfig : IEntityTypeConfiguration<RemainingPayment>
    {
        public void Configure(EntityTypeBuilder<RemainingPayment> builder)
        {
            builder.HasKey(remainingPayment => remainingPayment.Id);

            builder.Property(remainingPayment => remainingPayment.Id)
                   .UseIdentityColumn(1, 1);

            builder.Property(remainingPayment => remainingPayment.MethodType)
                   .HasConversion<string>();

            builder.Property(remainingPayment => remainingPayment.Status)
                   .HasConversion<string>()
                   .IsRequired();

            builder.Property(remainingPayment => remainingPayment.RequiredAmount)
                   .HasPrecision(18, 2)
                   .IsRequired();

            builder.Property(remainingPayment => remainingPayment.CreatedAt)
                   .IsRequired();

            builder.HasOne(remainingPayment => remainingPayment.Appointment)
                   .WithOne(appointment => appointment.RemainingPayment)
                   .HasForeignKey<RemainingPayment>(remainingPayment => remainingPayment.AppointmentId)
                   .OnDelete(DeleteBehavior.Restrict);


            builder.Property(remainingPayment => remainingPayment.RowVersion)
                   .IsRowVersion()
                   .IsConcurrencyToken();
        }
    }
}
