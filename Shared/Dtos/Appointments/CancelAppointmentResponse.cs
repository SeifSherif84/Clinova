using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Appointments
{
    public class CancelAppointmentResponse
    {
        public int AppointmentId { get; set; }
        public string AppointmentStatus { get; set; } = null!;
        public bool RefundEligible { get; set; }
        public string RefundEligibility { get; set; }
        public string? RefundStatus { get; set; }
        public decimal RefundAmount { get; set; }
        public string Message { get; set; } = null!;
    }
}
