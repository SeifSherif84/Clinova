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
    public class AppointmentSlotConfig : IEntityTypeConfiguration<AppointmentSlot>
    {
        public void Configure(EntityTypeBuilder<AppointmentSlot> builder)
        {
            builder.HasKey(availableSlot => availableSlot.Id);

            builder.Property(availableSlot => availableSlot.Id).UseIdentityColumn(1, 1);

            builder.Property(slot => slot.Status)
                   .HasConversion<string>();

            builder.HasOne(slot => slot.Doctor)
                   .WithMany()
                   .HasForeignKey(slot => slot.DoctorId)
                   .OnDelete(DeleteBehavior.Restrict);


            builder.HasOne(slot => slot.Clinic)
                   .WithMany()
                   .HasForeignKey(slot => slot.ClinicId)
                   .OnDelete(DeleteBehavior.Restrict);


            builder.HasMany(slot => slot.Appointments)
                   .WithOne(appointment => appointment.AppointmentSlot)
                   .HasForeignKey(appointment => appointment.AppointmentSlotId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
