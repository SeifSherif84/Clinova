using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Persistence.Data.Configurations
{
    public class ClinicImageConfig : IEntityTypeConfiguration<ClinicImages>
    {
        public void Configure(EntityTypeBuilder<ClinicImages> builder)
        {
            builder.HasKey(clinicImg => clinicImg.Id);

            builder.Property(clinicImg => clinicImg.Id).UseIdentityColumn(1, 1);


            builder.HasOne(clinicImg => clinicImg.Clinic)
                   .WithMany(clinic => clinic.Images)
                   .HasForeignKey(clinicImg => clinicImg.ClinicId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
