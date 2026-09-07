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
    public class AvailableSlotConfig : IEntityTypeConfiguration<AppointmentSlot>
    {
        public void Configure(EntityTypeBuilder<AppointmentSlot> builder)
        {
            builder.HasKey(availableSlot => availableSlot.Id);

            builder.Property(availableSlot => availableSlot.Id).UseIdentityColumn(1, 1);


            builder.HasOne(availableSlot => availableSlot.Appointment)
                   .WithOne(Appointment => Appointment.AppointmentSlot)
                   .HasForeignKey<Appointment>(Appointment => Appointment.AppointmentSlotId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
