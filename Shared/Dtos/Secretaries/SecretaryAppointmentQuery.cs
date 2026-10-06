using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Secretaries
{
    public class SecretaryAppointmentQuery
    {
        public string? DoctorName { get; set; }
        public DateOnly? SlotDate { get; set; }
        public AppointmentStatus? AppointmentStatus { get; set; }
        public PaymentStatus? PaymentStatus { get; set; }
        public int PageIndex { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
