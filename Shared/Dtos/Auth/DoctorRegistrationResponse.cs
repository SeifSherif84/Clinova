using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Auth
{
    public class DoctorRegistrationResponse
    {
        public string Message { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string DoctorApprovalStatusName { get; set; } = null!;
    }
}
