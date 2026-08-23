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
    public class ClinicConfig : IEntityTypeConfiguration<Clinic>
    {
        public void Configure(EntityTypeBuilder<Clinic> builder)
        {
            builder.HasKey(clinic => clinic.Id);

            builder.Property(clinic => clinic.Id).UseIdentityColumn(1, 1);


            builder.HasMany(clinic => clinic.DoctorClinics)
                   .WithOne(doctorClinic => doctorClinic.Clinic)
                   .HasForeignKey(doctorClinic => doctorClinic.ClinicId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.Property(clinic => clinic.Name)
                   .HasColumnType("varchar")
                   .HasMaxLength(128)
                   .IsRequired();
            builder.Property(clinic => clinic.StreetName)
                   .HasColumnType("varchar")
                   .HasMaxLength(128)
                   .IsRequired();

            builder.Property(clinic => clinic.Landmark)
                   .HasColumnType("varchar")
                   .HasMaxLength(512)
                   .IsRequired();

            builder.Property(clinic => clinic.ConsultationFee)
                   .HasColumnType("decimal(18, 2)")
                   .IsRequired();

            builder.ToTable("Clinics");

        }
    }
}
