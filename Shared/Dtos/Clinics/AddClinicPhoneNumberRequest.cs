using Shared.Attributes;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Clinics
{
    public class AddClinicPhoneNumberRequest
    {
        [Required]
        [EgyptianPhone]
        public string PhoneNumber { get; set; } = null!;
    }
}
