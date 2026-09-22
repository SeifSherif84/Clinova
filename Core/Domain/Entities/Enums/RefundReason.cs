using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.Enums
{
    public enum RefundReason
    {
        PatientCancellation = 1,
        LatePaymentAfterReservationExpiration,
        ClinicCancellation
    }
}
