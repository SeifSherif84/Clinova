using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.Abstractions;
using Shared.Dtos.AppointmentSlots;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Presentation.Controllers.AppointmentSlots
{
    [ApiController]
    public class AppointmentSlotsController(IServiceManager _serviceManager) : ControllerBase
    {
        //[Authorize(Roles = "Patient")]
        //[HttpGet("doctors/{doctorId}/clinics/{clinicId}")]
        //public async Task<IActionResult> GetAvailableAppointmentSlots([FromRoute] string doctorId,
        //                                                              [FromRoute] int clinicId,
        //                                                              [FromQuery] GetAvailableAppointmentSlotRequest request)
        //{
        //    var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        //    var response = await _serviceManager.AppointmentSlotService.GetAvailableAppointmentSlotsAsync(userId ?? string.Empty, doctorId, clinicId, request);
        //    return Ok(response);
        //}


        [Authorize(Roles = "Secretary")]
        [HttpGet("api/available-days/doctors/{doctorId}")]
        public async Task<IActionResult> GetDoctorDaysWhichHaveAvailableSlot([FromRoute] string doctorId,
                                                                             [FromQuery] DoctorDaysWhichHaveAvailableSlotRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentSlotService.GetDoctorDaysWhichHaveAvailableSlotAsync(userId ?? string.Empty, doctorId, request);
            return Ok(response);
        }


        [Authorize(Roles = "Secretary")]
        [HttpGet("api/available-slots/doctors/{doctorId}")]
        public async Task<IActionResult> GetAvailableAppointmentSlotsExistInSpecificDate([FromRoute] string doctorId,
                                                                                         [FromQuery] AvailableAppointmentSlotsExistInSpecificDateRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentSlotService.GetAvailableAppointmentSlotsExistInSpecificDateAsync(userId ?? string.Empty, doctorId, request);
            return Ok(response);
        }


    }
}
