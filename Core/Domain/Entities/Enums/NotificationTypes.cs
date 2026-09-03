using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.Enums
{
    public enum NotificationType
    {
        AppointmentReminder = 1,
        BookingConfirmation,
        PaymentSuccess,
        InvitationReceived,
        InvitationAccepted,
        InvitationRejected,
        InvitationCancelled,
        ReviewSubmitted
    }
}
