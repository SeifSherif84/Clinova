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
    public class PaymentMethodConfig : IEntityTypeConfiguration<PaymentMethod>
    {
        public void Configure(EntityTypeBuilder<PaymentMethod> builder)
        {
            builder.HasKey(paymentMethod => paymentMethod.Id);

            builder.Property(paymentMethod => paymentMethod.Id).UseIdentityColumn(1, 1);

            builder.HasMany(paymentMethod => paymentMethod.Payments)
                   .WithOne(payment => payment.PaymentMethod)
                   .HasForeignKey(payment => payment.PaymentMethodId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
