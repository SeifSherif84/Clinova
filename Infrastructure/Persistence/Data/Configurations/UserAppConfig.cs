using Domain.Entities.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Persistence.Data.Configurations
{
    public class UserAppConfig : IEntityTypeConfiguration<UserApp>
    {
        public void Configure(EntityTypeBuilder<UserApp> builder)
        {
            builder.Property(user => user.FirstName)
                   .HasColumnType("varchar")
                   .HasMaxLength(128)
                   .IsRequired();

            builder.Property(user => user.LastName)
                   .HasColumnType("varchar")
                   .HasMaxLength(128)
                   .IsRequired();

            builder.ToTable("Users");
        }
    }
}
