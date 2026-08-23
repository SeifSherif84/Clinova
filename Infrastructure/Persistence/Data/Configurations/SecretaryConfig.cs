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
    public class SecretaryConfig : IEntityTypeConfiguration<Secretary>
    {
        public void Configure(EntityTypeBuilder<Secretary> builder)
        {
            builder.HasOne(secretary => secretary.Clinic)
                   .WithMany(clinic => clinic.Secretaries)
                   .HasForeignKey(secretary => secretary.ClinicId)
                   .OnDelete(DeleteBehavior.SetNull);

            builder.ToTable("Secretaries");
        }
    }
}
