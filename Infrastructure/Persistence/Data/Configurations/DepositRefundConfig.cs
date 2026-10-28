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
    public class DepositRefundConfig : IEntityTypeConfiguration<DepositRefund>
    {
        public void Configure(EntityTypeBuilder<DepositRefund> builder)
        {
            builder.HasKey(depositRefund => depositRefund.Id);

            builder.Property(depositRefund => depositRefund.Id).UseIdentityColumn(1, 1);

            builder.Property(depositRefund => depositRefund.RequestedRefundAmount)
                   .HasPrecision(18, 2);

            builder.Property(depositRefund => depositRefund.Status)
                   .HasConversion<string>();

            builder.Property(depositRefund => depositRefund.Reason)
                   .HasConversion<string>();

            builder.Property(depositRefund => depositRefund.MethodType)
                   .HasConversion<string>();

            builder.Property(depositRefund => depositRefund.IdempotencyKey)
                   .IsRequired()
                   .HasMaxLength(100);

            builder.HasIndex(depositRefund => depositRefund.IdempotencyKey)
                   .IsUnique();

            builder.Property(depositRefund => depositRefund.OriginalTransactionId)
                   .IsRequired(false)
                   .HasMaxLength(100);

            builder.Property(depositRefund => depositRefund.ProviderRefundTransactionId)
                   .HasMaxLength(100);

            builder.Property(depositRefund => depositRefund.ManualTransactionReference)
                   .HasMaxLength(100);

            builder.Property(depositRefund => depositRefund.FailureReason)
                   .HasMaxLength(2000);

            builder.Property(depositRefund => depositRefund.ProviderResponse)
                   .HasMaxLength(10000);

            builder.Property(depositRefund => depositRefund.RowVersion)
                   .IsRowVersion()
                   .IsConcurrencyToken();

            builder.HasOne(depositRefund => depositRefund.DepositPayment)
                   .WithOne(depositPayment => depositPayment.DepositRefund)
                   .HasForeignKey<DepositRefund>(depositRefund => depositRefund.DepositPaymentId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(depositRefund => depositRefund.RequestedBySecretary)
                   .WithMany(secretary => secretary.RequestedDepositRefunds)
                   .HasForeignKey(depositRefund => depositRefund.RequestedBySecretaryId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(depositRefund => depositRefund.ProcessedBySecretary)
                   .WithMany(secretary => secretary.ProcessedDepositRefunds)
                   .HasForeignKey(depositRefund => depositRefund.ProcessedBySecretaryId)
                   .OnDelete(DeleteBehavior.Restrict);


            builder.HasIndex(depositRefund => depositRefund.DepositPaymentId)
                   .IsUnique();
        }
    }
}
