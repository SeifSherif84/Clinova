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
    public class MedicalSpecialtyConfig : IEntityTypeConfiguration<MedicalSpecialty>
    {
        public void Configure(EntityTypeBuilder<MedicalSpecialty> builder)
        {
            builder.HasKey(Medicalspecialty => Medicalspecialty.Id);

            builder.Property(Medicalspecialty => Medicalspecialty.Id).UseIdentityColumn(1, 1);

            builder.HasMany(Medicalspecialty => Medicalspecialty.Doctors)
                   .WithOne(doctor => doctor.MedicalSpecialty)
                   .HasForeignKey(doctor => doctor.MedicalSpecialtyId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
