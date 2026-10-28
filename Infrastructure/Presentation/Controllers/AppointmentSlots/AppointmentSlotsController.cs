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
    [Route("api/appointment-slots")]
    public class AppointmentSlotsController(IServiceManager _serviceManager) : ControllerBase
    {
        [Authorize(Roles = "Patient")]
        [HttpGet("patient-appointment/doctors/{doctorId}/clinics/{clinicId}/available-days")]
        public async Task<IActionResult> GetDoctorDaysWhichHaveAvailableSlotForPatientAppointment([FromRoute] string doctorId, [FromRoute] int clinicId ,
                                                                                                  [FromQuery] DoctorDaysWhichHaveAvailableSlotRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentSlotService.GetDoctorDaysWhichHaveAvailableSlotForPatientAppointmentAsync(userId ?? string.Empty, doctorId, clinicId, request);
            return Ok(response);
        }

        [Authorize(Roles = "Patient")]
        [HttpGet("patient-appointment/doctors/{doctorId}/clinics/{clinicId}/available-slots")]
        public async Task<IActionResult> GetAvailableAppointmentSlotsExistInSpecificDayForPatientAppointment([FromRoute] string doctorId, [FromRoute] int clinicId,
                                                                                                             [FromQuery] DoctorAvailableAppointmentSlotsExistInSpecificDayRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentSlotService.GetAvailableAppointmentSlotsExistInSpecificDayForPatientAppointmentAsync(userId ?? string.Empty, doctorId, clinicId, request);
            return Ok(response);
        }




        [Authorize(Roles = "Secretary")]
        [HttpGet("guest-reservation/doctors/{doctorId}/available-days")]
        public async Task<IActionResult> GetDoctorDaysWhichHaveAvailableSlotForGuestReservation([FromRoute] string doctorId, 
                                                                                                [FromQuery] DoctorDaysWhichHaveAvailableSlotRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentSlotService.GetDoctorDaysWhichHaveAvailableSlotForGuestReservationAsync(userId ?? string.Empty, doctorId, request);
            return Ok(response);
        }


        [Authorize(Roles = "Secretary")]
        [HttpGet("guest-reservation/doctors/{doctorId}/available-slots")]
        public async Task<IActionResult> GetAvailableAppointmentSlotsExistInSpecificDayForGuestReservation([FromRoute] string doctorId,
                                                                                                           [FromQuery] DoctorAvailableAppointmentSlotsExistInSpecificDayRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentSlotService.GetAvailableAppointmentSlotsExistInSpecificDayForGuestReservationAsync(userId ?? string.Empty, doctorId, request);
            return Ok(response);
        }




        [Authorize(Roles = "Patient")]
        [HttpGet("patient-reschedule/appointments/{appointmentId}/available-days")]
        public async Task<IActionResult> GetDoctorDaysWhichHaveAvailableSlotForPatientReschedule([FromRoute] int appointmentId, 
                                                                                                 [FromQuery] DoctorDaysWhichHaveAvailableSlotRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentSlotService.GetDoctorDaysWhichHaveAvailableSlotForPatientRescheduleAsync(userId ?? string.Empty, appointmentId, request);
            return Ok(response);
        }


        [Authorize(Roles = "Patient")]
        [HttpGet("patient-reschedule/appointments/{appointmentId}/available-slots")]
        public async Task<IActionResult> GetAvailableAppointmentSlotsExistInSpecificDayForPatientReschedule([FromRoute] int appointmentId, 
                                                                                                            [FromQuery] DoctorAvailableAppointmentSlotsExistInSpecificDayRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentSlotService.GetAvailableAppointmentSlotsExistInSpecificDayForPatientRescheduleAsync(userId ?? string.Empty, appointmentId, request);
            return Ok(response);
        }




        [Authorize(Roles = "Secretary")]
        [HttpGet("secretary-reschedule/appointments/{appointmentId}/available-days")]
        public async Task<IActionResult> GetDoctorDaysWhichHaveAvailableSlotForSecretaryReschedule([FromRoute] int appointmentId, 
                                                                                                   [FromQuery] DoctorDaysWhichHaveAvailableSlotRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentSlotService.GetDoctorDaysWhichHaveAvailableSlotForSecretaryRescheduleAsync(userId ?? string.Empty, appointmentId, request);
            return Ok(response);
        }


        [Authorize(Roles = "Secretary")]
        [HttpGet("secretary-reschedule/appointments/{appointmentId}/available-slots")]
        public async Task<IActionResult> GetAvailableAppointmentSlotsExistInSpecificDayForSecretaryReschedule([FromRoute] int appointmentId,
                                                                                                              [FromQuery] DoctorAvailableAppointmentSlotsExistInSpecificDayRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AppointmentSlotService.GetAvailableAppointmentSlotsExistInSpecificDayForSecretaryRescheduleAsync(userId ?? string.Empty, appointmentId, request);
            return Ok(response);
        }

    }
}
