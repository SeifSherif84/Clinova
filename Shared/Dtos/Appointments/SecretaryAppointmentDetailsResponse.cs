using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Appointments
{
    public class SecretaryAppointmentDetailsResponse
    {
        public int Id { get; set; }


        // Appointment Slot
        public DateOnly SlotDate { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }


        // Appointment
        public string AppointmentStatus { get; set; } = null!;


        // Doctor
        public string DoctorName { get; set; } = null!;


        // Patient
        public string PatientName { get; set; } = null!;
        public string PatientPhoneNumber { get; set; } = null!;


        // Payment
        public string PaymentStatus { get; set; } = null!;
        public string PaymentType { get; set; } = null!;
        public string? ManualPaymentMethodType { get; set; }

        public decimal PaymentAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public string? PaymentProofUrl { get; set; }
        public string? TransactionReference { get; set; }
    }
}
