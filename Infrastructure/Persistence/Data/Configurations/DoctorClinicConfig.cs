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
    public class DoctorClinicConfig : IEntityTypeConfiguration<DoctorClinic>
    {
        public void Configure(EntityTypeBuilder<DoctorClinic> builder)
        {
            builder.HasKey(doctorClinic => new
            {
                doctorClinic.DoctorId,
                doctorClinic.ClinicId
            });


            builder.HasMany(doctorClinic => doctorClinic.WorkingHours)
                   .WithOne(Workinghours => Workinghours.DoctorClinic)
                   .HasForeignKey(Workinghours => new { Workinghours.DoctorId, Workinghours.ClinicId })
                   .OnDelete(DeleteBehavior.Restrict);

        }
    }
}
