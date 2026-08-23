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
    public class ReviewConfig : IEntityTypeConfiguration<Review>
    {
        public void Configure(EntityTypeBuilder<Review> builder)
        {
            builder.HasKey(review => review.Id);

            builder.Property(review => review.Id).UseIdentityColumn(1, 1);

            builder.HasOne(review => review.Appointment)
                   .WithOne(appointment => appointment.Review)
                   .HasForeignKey<Review>(review => review.AppointmentId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
