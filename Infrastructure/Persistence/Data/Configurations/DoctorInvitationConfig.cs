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
    public class DoctorInvitationConfig : IEntityTypeConfiguration<DoctorInvitation>
    {
        public void Configure(EntityTypeBuilder<DoctorInvitation> builder)
        {
            builder.HasKey(invitation => invitation.Id);

            builder.Property(invitation => invitation.Id).UseIdentityColumn(1, 1);

            builder.HasOne(invitation => invitation.DoctorSender)
                   .WithMany(doctor => doctor.DoctorInvitationsSent)
                   .HasForeignKey(invitation => invitation.DoctorSenderId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(invitation => invitation.DoctorReceiver)
                   .WithMany(doctor => doctor.DoctorInvitationsReceived)
                   .HasForeignKey(invitation => invitation.DoctorReceiverId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(invitation => invitation.Clinic)
                   .WithMany(clinic => clinic.DoctorInvitations)
                   .HasForeignKey(invitation => invitation.ClinicId)
                   .OnDelete(DeleteBehavior.Cascade);

        }
    }
}
