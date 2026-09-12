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
    public class ClinicPaymentMethodConfig : IEntityTypeConfiguration<ClinicPaymentMethod>
    {
        public void Configure(EntityTypeBuilder<ClinicPaymentMethod> builder)
        {
            builder.HasOne(clinicPaymentMethod => clinicPaymentMethod.Clinic)
                   .WithMany(clinic => clinic.PaymentMethods)
                   .HasForeignKey(clinicPaymentMethod => clinicPaymentMethod.ClinicId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(clinicPaymentMethod => clinicPaymentMethod.Payments)
                   .WithOne(payment => payment.ClinicPaymentMethod)
                   .HasForeignKey(payment => payment.ClinicPaymentMethodId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
