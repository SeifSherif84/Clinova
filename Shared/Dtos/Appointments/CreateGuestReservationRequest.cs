using Domain.Entities.Enums;
using Shared.Attributes;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Appointments
{
    public class CreateGuestReservationRequest
    {
        [Required]
        [EnumDataType(typeof(BookingType))]
        public BookingType BookingType { get; set; }


        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string GuestPatientName { get; set; } = null!;


        [Required]
        [EgyptianPhone]
        [StringLength(11, MinimumLength = 11)]
        public string GuestPatientPhone { get; set; } = null!;
    }
}
