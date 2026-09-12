using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.Enums
{
    public enum PaymentStatus
    {
        Pending = 1,
        PendingVerification,
        Paid,
        Failed,
        Rejected,
        Refunded,
        PartiallyRefunded
    }
}
