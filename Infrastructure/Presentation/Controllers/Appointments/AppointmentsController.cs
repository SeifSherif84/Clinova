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
    public class AppointmentsController(IServiceManager _serviceManager,
        IPaymobRefundService _refundService) : ControllerBase
    {
        [Authorize(Roles = "Patient")]
        [HttpPost("slots/{appointmentSlotId}")]
        public async Task<IActionResult> CreateAppointment([FromRoute] int appointmentSlotId,
                                                           [FromBody] CreateAppointmentRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentService.CreateAppointmentAsync(userId ?? string.Empty, appointmentSlotId, request);
            return Ok(response);
        }


        [Authorize(Roles = "Patient")]
        [HttpGet]
        public async Task<IActionResult> GetPatientAppointments()
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentService.GetPatientAppointmentsAsync(userId ?? string.Empty);
            return Ok(response);
        }


        [Authorize(Roles = "Patient")]
        [HttpGet("{appointmentId}")]
        public async Task<IActionResult> GetPatientAppointmentDetails([FromRoute] int appointmentId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentService.GetPatientAppointmentDetailsAsync(userId ?? string.Empty, appointmentId);
            return Ok(response);
        }



        [Authorize(Roles = "Patient")]
        [HttpPatch("{appointmentId}/cancel")]
        public async Task<IActionResult> CancelAppointmentByPatient([FromRoute] int appointmentId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentService.CancelAppointmentByPatientAsync(userId ?? string.Empty, appointmentId);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpPatch("{appointmentId}/doctor-cancel")]
        public async Task<IActionResult> CancelAppointmentByDoctor([FromRoute] int appointmentId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentService.CancelAppointmentByDoctorAsync(userId ?? string.Empty, appointmentId);
            return Ok(response);
        }


        [Authorize(Roles = "Patient")]
        [HttpGet("cancellation-policy")]
        public IActionResult GetCancellationPolicy()
        {
            var response = _serviceManager.AppointmentService.GetCancellationPolicyAsync();
            return Ok(response);
        }



        [HttpPost("test/refund/{paymentId}")]
        public async Task<IActionResult> TestRefund([FromRoute] int paymentId)
        {
            var result = await _refundService.RefundPaymentAsync(
                paymentId,
                RefundReason.PatientCancellation);

            return Ok(result);
        }


    }
}
