using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Appointments
{
    public class SecretaryMarkAppointmentCompletedRequest
    {
        [Required]
        [EnumDataType(typeof(RemainingPaymentMethodType))]
        public RemainingPaymentMethodType RemainingPaymentMethodType { get; set; }

        [Range(1, int.MaxValue)]
        public int? ClinicManualPaymentMethodId { get; set; }
    }
}
