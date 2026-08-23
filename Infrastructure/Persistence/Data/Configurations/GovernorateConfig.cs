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
    public class GovernorateConfig : IEntityTypeConfiguration<Governorate>
    {
        public void Configure(EntityTypeBuilder<Governorate> builder)
        {
            builder.HasKey(Gov => Gov.Id);

            builder.Property(availableSlot => availableSlot.Id).UseIdentityColumn(1, 1);


            builder.HasMany(Gov => Gov.Regions)
                   .WithOne(region => region.Governorate)
                   .HasForeignKey(region => region.GovernorateId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.Property(Gov => Gov.Name)
                   .IsRequired()
                   .HasMaxLength(100);
        }
    }
}
