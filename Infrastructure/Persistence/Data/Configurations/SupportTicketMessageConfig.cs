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
    public class SupportTicketMessageConfig : IEntityTypeConfiguration<SupportTicketMessage>
    {
        public void Configure(EntityTypeBuilder<SupportTicketMessage> builder)
        {
            builder.HasKey(message => message.Id);

            builder.Property(message => message.Id)
                   .UseIdentityColumn(1, 1);

            builder.Property(message => message.Message)
                   .IsRequired()
                   .HasMaxLength(3000);

            builder.Property(message => message.CreatedAt)
                   .IsRequired();

            builder.HasOne(message => message.SupportTicket)
                   .WithMany(ticket => ticket.Messages)
                   .HasForeignKey(message => message.SupportTicketId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(message => message.Sender)
                   .WithMany(user => user.SupportTicketMessages)
                   .HasForeignKey(message => message.SenderId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(message => message.SupportTicketId);

            builder.HasIndex(message => message.SenderId);
        }
    }
}
