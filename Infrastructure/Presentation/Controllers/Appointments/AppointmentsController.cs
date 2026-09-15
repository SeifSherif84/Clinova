using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Services.Abstractions;
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
    [Route("api/appointment")]
    public class AppointmentsController(IServiceManager _serviceManager) : ControllerBase
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

    }
}
