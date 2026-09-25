using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.Enums
{
    public enum RefundStatus
    {
        Processing = 1,
        Succeeded,
        Failed,
        PendingVerification
    }
}
