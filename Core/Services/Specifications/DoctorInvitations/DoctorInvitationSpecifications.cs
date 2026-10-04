using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Services.DoctorInvitations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Specifications.DoctorInvitations
{
    public class DoctorInvitationSpecifications : BaseSpecifications<DoctorInvitation, int>
    {
        // Constructor to get invitation with specific senderId, receiverId, clinicId, and pending status
        public DoctorInvitationSpecifications(string senderId,
                                              string receiverId,
                                              int clinicId,
                                              InvitationStatus pendingStatus) : base()
        {
            ApplyCriteriaToGetInvitationWithSpecificData(senderId, receiverId, clinicId, pendingStatus);
        }

        private void ApplyCriteriaToGetInvitationWithSpecificData(string senderId,
                                                                  string receiverId,
                                                                  int clinicId,
                                                                  InvitationStatus pendingStatus)
        {
            Criteria = invitation => invitation.DoctorSenderId == senderId &&
                                     invitation.DoctorReceiverId == receiverId &&
                                     invitation.ClinicId == clinicId &&
                                     invitation.Status == pendingStatus;
        }




        // Constructor to get invitations for a specific doctor based on the direction (sent or received) and optional includes
        public DoctorInvitationSpecifications(string doctorId,
                                              DoctorInvitationDirection direction,
                                              bool includeSender = false,
                                              bool includeReceiver = false,
                                              bool includeClinic = false) : base()
        {
            ApplyCriteriaToGetSentOrReceivedInvitationsForSpecificDoctor(doctorId, direction);
            ApplyIncludes(includeSender, includeReceiver, includeClinic);
        }

        private void ApplyCriteriaToGetSentOrReceivedInvitationsForSpecificDoctor(string doctorId, 
                                                                                  DoctorInvitationDirection direction)
        {
            Criteria = direction switch
            {
                DoctorInvitationDirection.Sent => invitation => invitation.DoctorSenderId == doctorId,
                DoctorInvitationDirection.Received => invitation => invitation.DoctorReceiverId == doctorId,
                _ => throw new ArgumentException("Invalid invitation direction", nameof(direction))
            };
        }




        // Constructor to get invitation with specific invitationId and optional includes
        public DoctorInvitationSpecifications(int invitationId,
                                              bool includeSender = false,
                                              bool includeReceiver = false,
                                              bool includeClinic = false) : base()
        {
            ApplyCriteriaToGetInvitationWithSpecificId(invitationId);
            ApplyIncludes(includeSender, includeReceiver, includeClinic);
        }

        private void ApplyCriteriaToGetInvitationWithSpecificId(int invitationId)
        {
            Criteria = invitation => invitation.Id == invitationId;
        }





        private void ApplyIncludes(bool includeSender,
                                   bool includeReceiver,
                                   bool includeClinic)
        {
            if (includeSender)
                Includes.Add(invitation => invitation.DoctorSender);
            if (includeReceiver)
                Includes.Add(invitation => invitation.DoctorReceiver);
            if (includeClinic)
                Includes.Add(invitation => invitation.Clinic);
        }

    }
}
