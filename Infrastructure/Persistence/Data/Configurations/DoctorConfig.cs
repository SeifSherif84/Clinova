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
    public class DoctorConfig : IEntityTypeConfiguration<Doctor>
    {
        public void Configure(EntityTypeBuilder<Doctor> builder)
        {
            builder.HasMany(doctor => doctor.DoctorClinics)
                   .WithOne(doctorClinic => doctorClinic.Doctor)
                   .HasForeignKey(doctorClinic => doctorClinic.DoctorId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.ToTable("Doctors");
        }
    }
}
