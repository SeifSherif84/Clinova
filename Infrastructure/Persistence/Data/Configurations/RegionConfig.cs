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
    public class RegionConfig : IEntityTypeConfiguration<Region>
    {
        public void Configure(EntityTypeBuilder<Region> builder)
        {
            builder.HasKey(region => region.Id);

            builder.Property(region => region.Id).UseIdentityColumn(1, 1);

            builder.Property(region => region.Name)
                   .IsRequired()
                   .HasMaxLength(100);
        }
    }
}
