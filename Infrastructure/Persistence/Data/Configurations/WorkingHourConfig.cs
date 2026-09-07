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
    public class WorkingHourConfig : IEntityTypeConfiguration<WorkingHour>
    {
        public void Configure(EntityTypeBuilder<WorkingHour> builder)
        {
            builder.HasKey(workingHours => workingHours.Id);

            builder.Property(workingHours => workingHours.Id).UseIdentityColumn(1, 1);

            builder.HasMany(workingHours => workingHours.AppointmentSlots)
                   .WithOne(availableSlot => availableSlot.WorkingHour)
                   .HasForeignKey(availableSlot => availableSlot.WorkingHourId)
                   .OnDelete(DeleteBehavior.SetNull);

            builder.HasIndex(workingHours => new
            {
                workingHours.DoctorId,
                workingHours.ClinicId,
                workingHours.Day
            }).IsUnique();
        }
    }
}
