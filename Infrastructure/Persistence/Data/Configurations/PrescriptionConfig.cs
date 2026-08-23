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
    public class PrescriptionConfig : IEntityTypeConfiguration<Prescription>
    {
        public void Configure(EntityTypeBuilder<Prescription> builder)
        {
            builder.HasKey(prescription => prescription.Id);

            builder.Property(prescription => prescription.Id).UseIdentityColumn(1, 1);

            builder.HasOne(prescription => prescription.Appointment)
                   .WithOne(appointment => appointment.Prescription)
                   .HasForeignKey<Prescription>(prescription => prescription.AppointmentId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
