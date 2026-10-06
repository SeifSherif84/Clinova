using Shared.Dtos.Appointments;
using Shared.Dtos.ClinovaSettings;
using Shared.Dtos.Secretaries;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.Appointments
{
    public interface IAppointmentService
    {
        Task<string> PatientCreateAppointmentAsync(string userId, int appointmentSlotId, CreateAppointmentRequest request);
        Task<IEnumerable<PatientAppointmentResponse>> GetPatientAppointmentsAsync(string userId);
        Task<PatientAppointmentDetailsResponse> GetPatientAppointmentDetailsAsync(string userId, int appointmentId);
        Task<CancelAppointmentResponse> CancelAppointmentByPatientAsync(string userId, int appointmentId);
        Task<CancelAppointmentResponse> CancelAppointmentByDoctorAsync(string userId, int appointmentId);
        CancellationPolicyResponse GetCancellationPolicyAsync();
        Task ExpirePendingAppointmentsAsync();
        Task<PaginatedResult<SecretaryAppointmentResponse>> GetClinicAppointmentsForSecretaryAsync(string secretaryId, int clinicId, SecretaryAppointmentQuery query);
    }
}
