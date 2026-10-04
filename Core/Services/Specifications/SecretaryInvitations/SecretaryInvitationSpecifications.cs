using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Services.DoctorInvitations;
using Services.MailKitFeature;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Specifications.SecretaryInvitations
{
    public class SecretaryInvitationSpecifications : BaseSpecifications<SecretaryInvitation, int>
    {
        public SecretaryInvitationSpecifications() : base()
        {

        }


        public static SecretaryInvitationSpecifications PendingSecretaryInvitationById(string secretaryId, int clinicId)
        {
            var specifications = new SecretaryInvitationSpecifications
            {
                Criteria = invitation => invitation.SecretaryReceiverId == secretaryId &&
                                         invitation.ClinicId == clinicId &&
                                         invitation.Status == InvitationStatus.Pending
            };
            return specifications;
        }


        public static SecretaryInvitationSpecifications PendingSecretaryInvitationByEmail(string email, int clinicId)
        {
            var specifications = new SecretaryInvitationSpecifications
            {
                Criteria = invitation => invitation.SecretaryReceiverEmail == email &&
                                         invitation.ClinicId == clinicId &&
                                         invitation.Status == InvitationStatus.Pending
            };
            return specifications;
        }


        public static SecretaryInvitationSpecifications PendingUnlinkedSecretaryInvitationByEmail(string email)
        {
            var specifications = new SecretaryInvitationSpecifications
            {
                Criteria = invitation => invitation.SecretaryReceiverEmail == email &&
                                         invitation.Status == InvitationStatus.Pending && 
                                         invitation.SecretaryReceiverId == null
            };
            return specifications;
        }


        public static SecretaryInvitationSpecifications SentSecretaryInvitationByDoctorId(string doctorId)
        {
            var specifications = new SecretaryInvitationSpecifications
            {
                Criteria = invitation => invitation.DoctorSenderId == doctorId
            };

            specifications.Includes.Add(invitation => invitation.SecretaryReceiver);
            specifications.Includes.Add(invitation => invitation.Clinic);

            return specifications;
        }


        public static SecretaryInvitationSpecifications ReceivedSecretaryInvitationBySecretaryId(string secretaryId)
        {
            var specifications = new SecretaryInvitationSpecifications
            {
                Criteria = invitation => invitation.SecretaryReceiverId == secretaryId
            };

            specifications.Includes.Add(invitation => invitation.DoctorSender);
            specifications.Includes.Add(invitation => invitation.Clinic);

            return specifications;
        }


        public static SecretaryInvitationSpecifications SecretaryInvitationById(int secretaryInvitationId)
        {
            var specifications = new SecretaryInvitationSpecifications
            {
                Criteria = invitation => invitation.Id == secretaryInvitationId
            };

            specifications.Includes.Add(invitation => invitation.Clinic);

            return specifications;
        }

    }
}
