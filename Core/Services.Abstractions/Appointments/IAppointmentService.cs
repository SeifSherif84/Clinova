using Shared.Dtos.Appointments;
using Shared.Dtos.ClinovaSettings;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.Appointments
{
    public interface IAppointmentService
    {
        Task<string> CreateAppointmentAsync(string userId, int appointmentSlotId, CreateAppointmentRequest request);
        Task<IEnumerable<PatientAppointmentResponse>> GetPatientAppointmentsAsync(string userId);
        Task<PatientAppointmentDetailsResponse> GetPatientAppointmentDetailsAsync(string userId, int appointmentId);
        Task<CancelAppointmentResponse> CancelAppointmentAsync(string userId, int appointmentId);
        CancellationPolicyResponse GetCancellationPolicyAsync();
        Task ExpirePendingAppointmentsAsync();
    }
}
