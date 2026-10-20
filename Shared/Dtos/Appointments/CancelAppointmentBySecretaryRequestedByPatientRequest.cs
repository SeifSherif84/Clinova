using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Appointments
{
    public class CancelGuestAppointmentBySecretaryRequestedByPatientRequest
    {
        // Used only when the appointment details indicate a guest reservation:
        // BookingSource == BookingSource.Secretary and PatientId is null or empty.
        // For registered patient bookings (BookingSource == BookingSource.Patient
        // and PatientId is not null or empty), the backend determines refund
        // eligibility automatically using Clinova's cancellation policy.
        public bool IsRefundDue { get; set; }
    }
}
