using Domain.Entities.BusinessEntities;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Persistence.Data.Configurations
{
    public class SupportTicketConfig : IEntityTypeConfiguration<SupportTicket>
    {
        public void Configure(EntityTypeBuilder<SupportTicket> builder)
        {
            builder.HasKey(ticket => ticket.Id);

            builder.Property(ticket => ticket.Id)
                   .UseIdentityColumn(1, 1);

            builder.Property(ticket => ticket.OriginalMessage)
                   .IsRequired()
                   .HasMaxLength(3000);

            builder.Property(ticket => ticket.Category)
                   .HasConversion<string>()
                   .IsRequired();

            builder.Property(ticket => ticket.Status)
                   .HasConversion<string>()
                   .IsRequired();

            builder.Property(ticket => ticket.CreatedAt)
                   .IsRequired();

            builder.HasOne(ticket => ticket.UserApp)
                   .WithMany(user => user.SupportTickets)
                   .HasForeignKey(ticket => ticket.UserAppId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(ticket => ticket.UserAppId);
            builder.HasIndex(ticket => ticket.Status);
        }
    }
}
