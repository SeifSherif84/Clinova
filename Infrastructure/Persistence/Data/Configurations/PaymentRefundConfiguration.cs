using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Domain.Entities.BusinessEntities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Persistence.Data.Configurations
{


    public class PaymentRefundConfiguration : IEntityTypeConfiguration<PaymentRefund>
    {
        public void Configure(EntityTypeBuilder<PaymentRefund> builder)
        {
            builder.HasKey(refund => refund.Id);

            builder.Property(refund => refund.IdempotencyKey)
                   .IsRequired()
                   .HasMaxLength(100);

            builder.HasIndex(refund => refund.IdempotencyKey)
                   .IsUnique();

            builder.Property(refund => refund.Amount)
                   .HasPrecision(18, 2);

            builder.Property(refund => refund.OriginalTransactionId)
                   .IsRequired()
                   .HasMaxLength(100);

            builder.Property(refund => refund.ProviderRefundTransactionId)
                   .HasMaxLength(100);

            builder.Property(refund => refund.FailureReason)
                   .HasMaxLength(2000);

            builder.Property(refund => refund.ProviderResponse)
                   .HasMaxLength(10000);

            builder.Property(refund => refund.RowVersion)
                   .IsRowVersion()
                   .IsConcurrencyToken();


            builder.HasOne(refund => refund.Payment)
                   .WithOne(refund => refund.Refund)
                   .HasForeignKey<PaymentRefund>(refund => refund.PaymentId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(refund => refund.PaymentId)
                   .IsUnique();

        }
    }
}
