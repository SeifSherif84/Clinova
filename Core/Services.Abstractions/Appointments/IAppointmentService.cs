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
        Task<string> PatientCreateAppointmentAsync(string userId, int appointmentSlotId, CreateAppointmentRequest request);
        Task<IEnumerable<PatientAppointmentResponse>> GetPatientAppointmentsAsync(string userId);
        Task<PatientAppointmentDetailsResponse> GetPatientAppointmentDetailsAsync(string userId, int appointmentId);
        Task<string> CancelAppointmentByPatientAsync(string userId, int appointmentId);
        CancellationPolicyResponse GetCancellationPolicy();

        Task ExpirePendingAppointmentsAsync();

        //Task<CancelAppointmentResponse> CancelAppointmentByDoctorAsync(string userId, int appointmentId);

        Task<PaginatedResult<SecretaryAppointmentResponse>> GetClinicAppointmentsForSecretaryAsync(string secretaryId, SecretaryAppointmentQuery query);
        Task<SecretaryAppointmentDetailsResponse> GetClinicAppointmentDetailsForSecretaryAsync(string secretaryId, int appointmentId);
        Task<string> PatientSubmitManualPaymentProofAsync(string userId, int appointmentId, SubmitManualPaymentProofRequest request);
        Task<string> ApproveManualPaymentAsync(string userId, int appointmentId);
        Task<string> RejectManualPaymentAsync(string userId, int appointmentId, RejectManualPaymentRequest request);



        Task<string> CancelAppointmentBySecretaryRequestedByClinicOrDoctorAsync(string secretaryId, int appointmentId);
        Task<string> CancelAppointmentBySecretaryRequestedByPatientAsync(string secretaryId, int appointmentId, CancelGuestAppointmentBySecretaryRequestedByPatientRequest request);
        



        Task<string> SecretaryMarkAppointmentCompletedAsync(string secretaryId, int appointmentId);
        Task<string> SecretaryMarkAppointmentNoShowAsync(string secretaryId, int appointmentId);
        Task<string> SecretaryConfirmManualRefundAsync(string secretaryId, int appointmentId, ConfirmManualRefundRequest request);


        Task<GuestAppointmentReservationCheckout> SecretaryCreateGuestReservationAsync(string secretaryId, int appointmentSlotId, CreateGuestReservationRequest request);
        Task<string> SecretaryConfirmGuestReservationPaymentAsync(string secretaryId, int appointmentId, ConfirmGuestReservationPaymentRequest request);
        Task<string> SecretaryCancelPendingGuestReservationBeforePaymentAsync(string secretaryId, int appointmentId);


        Task<string> RescheduleAppointmentByPatientAsync(string userId, int appointmentId, RescheduleAppointmentRequest request);
        Task<string> RescheduleAppointmentBySecretaryAsync(string userId, int appointmentId, RescheduleAppointmentRequest request);
    }
}
