using Domain.Entities.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Services.Abstractions;
using Services.Abstractions.Paymob;
using Shared.Dtos.Appointments;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Presentation.Controllers.Appointments
{
    [ApiController]
    [Route("api/appointments")]
    public class AppointmentsController(IServiceManager _serviceManager) : ControllerBase
    {
        [Authorize(Roles = "Patient")]
        [HttpPost("slots/{appointmentSlotId}")] // Post: /api/appointments/slots/{appointmentSlotId}
        public async Task<IActionResult> PatientCreateAppointment([FromRoute] int appointmentSlotId,
                                                           [FromBody] CreateAppointmentRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentService.PatientCreateAppointmentAsync(userId ?? string.Empty, appointmentSlotId, request);
            return Ok(response);
        }


        [Authorize(Roles = "Patient")]
        [HttpGet]// Get: /api/appointments
        public async Task<IActionResult> GetPatientAppointments()
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentService.GetPatientAppointmentsAsync(userId ?? string.Empty);
            return Ok(response);
        }


        [Authorize(Roles = "Patient")]
        [HttpGet("{appointmentId}")] // Get: /api/appointments/{appointmentId}
        public async Task<IActionResult> GetPatientAppointmentDetails([FromRoute] int appointmentId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentService.GetPatientAppointmentDetailsAsync(userId ?? string.Empty, appointmentId);
            return Ok(response);
        }



        [Authorize(Roles = "Patient")]
        [HttpPatch("{appointmentId}/patient-cancel")] // Patch: /api/appointments/{appointmentId}/patient-cancel
        public async Task<IActionResult> CancelAppointmentByPatient([FromRoute] int appointmentId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentService.CancelAppointmentByPatientAsync(userId ?? string.Empty, appointmentId);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpPatch("{appointmentId}/doctor-cancel")] // Patch: /api/appointments/{appointmentId}/doctor-cancel
        public async Task<IActionResult> CancelAppointmentByDoctor([FromRoute] int appointmentId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentService.CancelAppointmentByDoctorAsync(userId ?? string.Empty, appointmentId);
            return Ok(response);
        }


        [Authorize(Roles = "Patient")]
        [HttpGet("cancellation-policy")] // Get: /api/appointments/cancellation-policy
        public IActionResult GetCancellationPolicy()
        {
            var response = _serviceManager.AppointmentService.GetCancellationPolicyAsync();
            return Ok(response);
        }



        [Authorize(Roles = "Secretary")]
        [HttpGet("management")] // Get: /api/appointments?date=2024-06-01&status=Pending&pageNumber=1&pageSize=10
        public async Task<IActionResult> GetClinicAppointmentsForSecretary([FromQuery] SecretaryAppointmentQuery query)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _serviceManager.AppointmentService.GetClinicAppointmentsForSecretaryAsync(userId ?? string.Empty, query);
            return Ok(result);
        }



        [Authorize(Roles = "Secretary")]
        [HttpGet("{appointmentId}/management")] // Get: /api/appointments/{appointmentId}
        public async Task<IActionResult> GetClinicAppointmentDetailsForSecretary([FromRoute] int appointmentId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _serviceManager.AppointmentService.GetClinicAppointmentDetailsForSecretaryAsync(userId ?? string.Empty, appointmentId);
            return Ok(result);
        }



        [Authorize(Roles = "Patient")]
        [HttpPost("{appointmentId}/payment-proof-submit")] // Post: /api/appointments/{appointmentId}/payment-proof-submit
        public async Task<IActionResult> PatientSubmitManualPaymentProof([FromRoute] int appointmentId,
                                                                         [FromForm] SubmitManualPaymentProofRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentService.PatientSubmitManualPaymentProofAsync(userId ?? string.Empty, appointmentId, request);
            return Ok(response);
        }


        [Authorize(Roles = "Secretary")]
        [HttpPost("{appointmentId}/manual-payment/approve")] // Post: /api/appointments/{appointmentId}/manual-payment/approve
        public async Task<IActionResult> ApproveManualPayment([FromRoute] int appointmentId)
        {
            var secretaryId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentService.ApproveManualPaymentAsync(secretaryId ?? string.Empty, appointmentId);
            return Ok(response);
        }


        [Authorize(Roles = "Secretary")]
        [HttpPost("{appointmentId}/manual-payment/reject")] // Post: /api/appointments/{appointmentId}/manual-payment/reject
        public async Task<IActionResult> RejectManualPayment([FromRoute] int appointmentId,
                                                             [FromBody] RejectManualPaymentRequest request)
        {
            var secretaryId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentService.RejectManualPaymentAsync(secretaryId ?? string.Empty, appointmentId, request);
            return Ok(response);
        }


        [Authorize(Roles = "Secretary")]
        [HttpPatch("{appointmentId}/secretary-cancel")] // Patch: /api/appointments/{appointmentId}/secretary-cancel
        public async Task<IActionResult> CancelAppointmentBySecretary([FromRoute] int appointmentId)
        {
            var secretaryId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentService.CancelAppointmentBySecretaryAsync(secretaryId ?? string.Empty, appointmentId);
            return Ok(response);
        }


        [Authorize(Roles = "Secretary")]
        [HttpPatch("{appointmentId}/mark-completed")] // Patch: /api/appointments/{appointmentId}/mark-completed
        public async Task<IActionResult> SecretaryMarkAppointmentCompleted([FromRoute] int appointmentId)
        {
            var secretaryId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentService.CancelAppointmentBySecretaryAsync(secretaryId ?? string.Empty, appointmentId);
            return Ok(response);
        }


        [Authorize(Roles = "Secretary")]
        [HttpPatch("{appointmentId}/mark-no-show")] // Patch: /api/appointments/{appointmentId}/mark-no-show
        public async Task<IActionResult> SecretaryMarkAppointmentNoShow([FromRoute] int appointmentId)
        {
            var secretaryId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentService.SecretaryMarkAppointmentNoShowAsync(secretaryId ?? string.Empty, appointmentId);
            return Ok(response);
        }


    }
}
