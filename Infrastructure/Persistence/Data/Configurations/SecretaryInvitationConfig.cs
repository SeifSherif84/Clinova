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
    public class SecretaryInvitationConfig : IEntityTypeConfiguration<SecretaryInvitation>
    {
        public void Configure(EntityTypeBuilder<SecretaryInvitation> builder)
        {
            builder.HasKey(invitation => invitation.Id);

            builder.Property(invitation => invitation.Id)
                   .UseIdentityColumn(1, 1);

            builder.Property(invitation => invitation.SecretaryReceiverEmail)
                   .HasColumnType("varchar")
                   .HasMaxLength(256)
                   .IsRequired();

            builder.HasOne(invitation => invitation.SecretaryReceiver)
                   .WithMany(secretary => secretary.SecretaryInvitationsReceived)
                   .HasForeignKey(invitation => invitation.SecretaryReceiverId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(invitation => invitation.DoctorSender)
                   .WithMany(doctor => doctor.SecretaryInvitationsSent)
                   .HasForeignKey(invitation => invitation.DoctorSenderId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(invitation => invitation.Clinic)
                   .WithMany(clinic => clinic.SecretaryInvitations)
                   .HasForeignKey(invitation => invitation.ClinicId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
