using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.Enums
{
    public enum SupportTicketCategory
    {
        GeneralInquiry = 1,
        Appointment = 2,
        Payment = 3,
        Refund = 4,
        Cancellation = 5,
        Account = 6,
        TechnicalIssue = 7,
        Other = 8
    }
}
