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
    public class ClinicOnlinePaymentAccountConfig : IEntityTypeConfiguration<ClinicOnlinePaymentAccount>
    {
        public void Configure(EntityTypeBuilder<ClinicOnlinePaymentAccount> builder)
        {
            builder.HasKey(onlinePaymentAccount => onlinePaymentAccount.Id);

            builder.Property(onlinePaymentAccount => onlinePaymentAccount.Id).UseIdentityColumn(1, 1);

            builder.Property(account => account.Provider)
                   .IsRequired();

            builder.Property(onlinePaymentAccount => onlinePaymentAccount.MerchantId)
                   .HasColumnType("varchar")
                   .HasMaxLength(200)
                   .IsRequired();


            builder.HasOne(onlinePaymentAccount => onlinePaymentAccount.Clinic)
                   .WithMany(clinic => clinic.OnlinePaymentAccounts)
                   .HasForeignKey(onlinePaymentAccount => onlinePaymentAccount.ClinicId)
                   .OnDelete(DeleteBehavior.Restrict);


            builder.HasMany(onlinePaymentAccount => onlinePaymentAccount.Payments)
                   .WithOne(payment => payment.ClinicOnlinePaymentAccount)
                   .HasForeignKey(payment => payment.ClinicOnlinePaymentAccountId)
                   .OnDelete(DeleteBehavior.Restrict);


            builder.HasIndex(onlinePaymentAccount => new
            {
                onlinePaymentAccount.ClinicId,
                onlinePaymentAccount.Provider
            }).IsUnique();

        }
    }
}
