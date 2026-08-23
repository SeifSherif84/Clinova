using Domain.Entities.Common;
using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.BusinessEntities
{
    public class Invitation : BaseEntity<int>
    {
        public InvitationStatus Status { get; set; } = InvitationStatus.Pending;
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        public DateTime? RespondedAt { get; set; }

        public string DoctorSenderId { get; set; } = null!;
        public Doctor DoctorSender { get; set; } = null!;

        public string DoctorReceiverId { get; set; } = null!;
        public Doctor DoctorReceiver { get; set; } = null!;

        public int ClinicId { get; set; }
        public Clinic Clinic { get; set; } = null!;

    }
}
