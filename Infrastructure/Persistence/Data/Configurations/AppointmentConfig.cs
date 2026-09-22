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

            builder.Property(appointment => appointment.ConsultationFee).HasColumnType("decimal(18,2)");
            builder.Property(appointment => appointment.DepositAmount).HasColumnType("decimal(18,2)");
            builder.Property(appointment => appointment.RemainingAmount).HasColumnType("decimal(18,2)");

            builder.HasIndex(appointment => appointment.AppointmentSlotId)
                   .IsUnique()
                   .HasFilter("[Status] IN (1, 2)");

            builder.Property(appointment => appointment.RowVersion)
                   .IsRowVersion()
                   .IsConcurrencyToken();
        }
    }
}
