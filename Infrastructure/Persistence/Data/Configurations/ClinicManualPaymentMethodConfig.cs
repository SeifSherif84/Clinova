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
    public class ClinicManualPaymentMethodConfig : IEntityTypeConfiguration<ClinicManualPaymentMethod>
    {
        public void Configure(EntityTypeBuilder<ClinicManualPaymentMethod> builder)
        {
            builder.HasKey(manualPaymentMethod => manualPaymentMethod.Id);

            builder.Property(manualPaymentMethod => manualPaymentMethod.Id)
                   .UseIdentityColumn(1, 1);

            builder.Property(manualPaymentMethod => manualPaymentMethod.Type)
                   .IsRequired();

            builder.Property(manualPaymentMethod => manualPaymentMethod.AccountIdentifier)
                   .HasColumnType("varchar")
                   .HasMaxLength(100)
                   .IsRequired();

            builder.Property(manualPaymentMethod => manualPaymentMethod.IsActive)
                   .IsRequired();

            builder.HasOne(manualPaymentMethod => manualPaymentMethod.Clinic)
                   .WithMany(clinic => clinic.ManualPaymentMethods)
                   .HasForeignKey(manualPaymentMethod => manualPaymentMethod.ClinicId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(manualPaymentMethod => manualPaymentMethod.Payments)
                   .WithOne(payment => payment.ClinicManualPaymentMethod)
                   .HasForeignKey(payment => payment.ClinicManualPaymentMethodId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(manualPaymentMethod => new
            {
                manualPaymentMethod.ClinicId,
                manualPaymentMethod.Type,
                manualPaymentMethod.AccountIdentifier
            }).IsUnique();

        }
    }
}
