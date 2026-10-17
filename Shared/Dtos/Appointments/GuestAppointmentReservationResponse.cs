using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Appointments
{
    public class GuestAppointmentReservationCheckout
    {
        public int AppointmentId { get; set; }
        public string GuestPatientName { get; set; } = null!;
        public string GuestPatientPhone { get; set; } = null!;
        public string BookingType { get; set; } = null!;
        public decimal ConsultationFee { get; set; }
        public decimal PaymentAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public DateTime ReservationExpiresAt { get; set; }
    }
}
