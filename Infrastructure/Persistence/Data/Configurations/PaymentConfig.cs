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
    public class PaymentConfig : IEntityTypeConfiguration<Payment>
    {
        public void Configure(EntityTypeBuilder<Payment> builder)
        {
            builder.HasKey(payment => payment.Id);

            builder.Property(payment => payment.Id).UseIdentityColumn(1, 1);

            builder.HasOne(payment => payment.Appointment)
                   .WithOne(appointment => appointment.Payment)
                   .HasForeignKey<Payment>(payment => payment.AppointmentId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.Property(payment => payment.TotalAmount).HasColumnType("decimal(18,2)");
            builder.Property(payment => payment.DepositAmount).HasColumnType("decimal(18,2)");
            builder.Property(payment => payment.PaidAmount).HasColumnType("decimal(18,2)");

            builder.Ignore(payment => payment.RemainingAmount);
        }
    }
}
