using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Appointments
{
    public class ConfirmGuestReservationPaymentRequest
    {
        [Required]
        [EnumDataType(typeof(GuestReservationPaymentMethod))]
        public GuestReservationPaymentMethod GuestReservationPaymentMethod { get; set; }


        [Range(1, int.MaxValue)]
        public int? ClinicManualPaymentMethodId { get; set; }
    }
}
