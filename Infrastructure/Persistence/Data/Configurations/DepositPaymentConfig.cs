using Domain.Entities.BusinessEntities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Persistence.Data.Configurations
{
    public class DepositPaymentConfig : IEntityTypeConfiguration<DepositPayment>
    {
        public void Configure(EntityTypeBuilder<DepositPayment> builder)
        {
            builder.HasKey(depositPayment => depositPayment.Id);

            builder.Property(depositPayment => depositPayment.Id)
                   .UseIdentityColumn(1, 1);

            builder.Property(depositPayment => depositPayment.MethodType)
                   .HasConversion<string>();

            builder.Property(depositPayment => depositPayment.Status)
                   .HasConversion<string>();

            builder.Property(x => x.RequiredAmount)
                   .HasPrecision(18, 2)
                   .IsRequired();

            builder.Property(depositPayment => depositPayment.SecretaryRejectionReason)
                   .HasColumnType("varchar")
                   .HasMaxLength(200);

            builder.HasOne(depositPayment => depositPayment.Appointment)
                   .WithOne(appointment => appointment.DepositPayment)
                   .HasForeignKey<DepositPayment>(depositPayment => depositPayment.AppointmentId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.Property(depositPayment => depositPayment.RowVersion)
                   .IsRowVersion()
                   .IsConcurrencyToken();   
        }
    }
}
