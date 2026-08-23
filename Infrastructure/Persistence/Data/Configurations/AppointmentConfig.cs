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
    public class AppointmentConfig : IEntityTypeConfiguration<Appointment>
    {
        public void Configure(EntityTypeBuilder<Appointment> builder)
        {
            builder.HasKey(appointment => appointment.Id);

            builder.Property(appointment => appointment.Id).UseIdentityColumn(1, 1);

            builder.Property(appointment => appointment.DoctorNotes).HasColumnType("varchar").HasMaxLength(512);
            builder.Property(appointment => appointment.PatientNotes).HasColumnType("varchar").HasMaxLength(512);


        }
    }
}
