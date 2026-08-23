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
    public class PatientConfig : IEntityTypeConfiguration<Patient>
    {
        public void Configure(EntityTypeBuilder<Patient> builder)
        {
            builder.HasMany(patient => patient.Appointments)
                   .WithOne(appointment => appointment.Patient)
                   .HasForeignKey(appointment => appointment.PatientId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
