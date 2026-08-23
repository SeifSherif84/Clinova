using Domain.Entities;
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
    internal class ClinicPhoneNumberConfig : IEntityTypeConfiguration<ClinicPhoneNumbers>
    {
        public void Configure(EntityTypeBuilder<ClinicPhoneNumbers> builder)
        {
            builder.HasKey(clinicPhone => clinicPhone.Id);

            builder.Property(clinicPhone => clinicPhone.Id).UseIdentityColumn(1, 1);


            builder.HasOne(clinicPhone => clinicPhone.Clinic)
                   .WithMany(clinic => clinic.PhoneNumbers)
                   .HasForeignKey(clinicPhone => clinicPhone.ClinicId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
