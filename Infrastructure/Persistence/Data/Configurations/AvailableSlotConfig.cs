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
    public class AvailableSlotConfig : IEntityTypeConfiguration<AvailableSlots>
    {
        public void Configure(EntityTypeBuilder<AvailableSlots> builder)
        {
            builder.HasKey(availableSlot => availableSlot.Id);

            builder.Property(availableSlot => availableSlot.Id).UseIdentityColumn(1, 1);


            builder.HasOne(availableSlot => availableSlot.Appointment)
                   .WithOne(Appointment => Appointment.AvailableSlot)
                   .HasForeignKey<Appointment>(Appointment => Appointment.AvailableSlotId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
