using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Invitations
{
    public class SentInvitationsResponse
    {
        public int Id { get; set; }
        public string ReceiverDoctorName { get; set; } = null!;
        public string ClinicName { get; set; } = null!;
        public string InvitationStatusName { get; set; } = null!;
        public DateTime SentAt { get; set; }
        public DateTime RespondedAt { get; set; }
    }
}
