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
    public class ClinicPaymentIntegrationConfig : IEntityTypeConfiguration<ClinicPaymentIntegration>
    {
        public void Configure(EntityTypeBuilder<ClinicPaymentIntegration> builder)
        {
            builder.HasKey(paymentIntegration => paymentIntegration.Id);

            builder.Property(paymentIntegration => paymentIntegration.Id).UseIdentityColumn(1, 1);

            builder.HasOne(paymentIntegration => paymentIntegration.ClinicOnlinePaymentAccount)
                   .WithMany(onlinePaymentAccount => onlinePaymentAccount.PaymentIntegrations)
                   .HasForeignKey(paymentIntegration => paymentIntegration.ClinicOnlinePaymentAccountId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(paymentIntegration => new
            {
                paymentIntegration.ClinicOnlinePaymentAccountId,
                paymentIntegration.PaymentMethod
            }).IsUnique();

        }
    }
}
