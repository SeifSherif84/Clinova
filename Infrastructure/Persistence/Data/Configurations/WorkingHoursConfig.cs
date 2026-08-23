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
    public class WorkingHoursConfig : IEntityTypeConfiguration<WorkingHours>
    {
        public void Configure(EntityTypeBuilder<WorkingHours> builder)
        {
            builder.HasKey(workingHours => workingHours.Id);

            builder.Property(workingHours => workingHours.Id).UseIdentityColumn(1, 1);

            builder.HasMany(workingHours => workingHours.AvailableSlots)
                   .WithOne(availableSlot => availableSlot.WorkingHours)
                   .HasForeignKey(availableSlot => availableSlot.WorkingHoursId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
