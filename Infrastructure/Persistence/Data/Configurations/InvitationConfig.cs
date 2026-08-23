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
    public class InvitationConfig : IEntityTypeConfiguration<Invitation>
    {
        public void Configure(EntityTypeBuilder<Invitation> builder)
        {
            builder.HasKey(invitation => invitation.Id);

            builder.Property(invitation => invitation.Id).UseIdentityColumn(1, 1);

            builder.HasOne(invitation => invitation.DoctorSender)
                   .WithMany(D => D.InvitationsSent)
                   .HasForeignKey(invitation => invitation.DoctorSenderId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(invitation => invitation.DoctorReceiver)
                   .WithMany(D => D.InvitationsReceived)
                   .HasForeignKey(invitation => invitation.DoctorReceiverId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(invitation => invitation.Clinic)
                   .WithMany(C => C.Invitations)
                   .HasForeignKey(invitation => invitation.ClinicId)
                   .OnDelete(DeleteBehavior.Cascade);

        }
    }
}
