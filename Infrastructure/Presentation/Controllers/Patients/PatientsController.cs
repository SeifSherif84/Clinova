using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.Abstractions;
using Shared.Dtos.Doctors;
using Shared.Dtos.Patients;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Presentation.Controllers.Patients
{
    [ApiController]
    [Route("api/patients")]
    public class PatientsController(IServiceManager _serviceManager) : ControllerBase
    {
        [Authorize(Roles = "Patient")]
        [HttpGet("me")] // Get api/patients/me
        public async Task<IActionResult> GetProfile()
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.PatientService.GetProfileAsync(userId ?? string.Empty);
            return Ok(response);
        }


        [Authorize(Roles = "Patient")]
        [HttpPatch("me")] // Patch api/patients/me
        public async Task<IActionResult> UpdateProfile([FromBody] UpdatePatientProfileRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.PatientService.UpdateProfileAsync(userId ?? string.Empty, request);
            return Ok(response);
        }


        [Authorize(Roles = "Patient")]
        [HttpPatch("me/profile-picture")] // Patch api/patients/me/profile-picture
        public async Task<IActionResult> UpdateProfilePicture([FromForm] UpdatePatientProfilePictureRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.PatientService.UpdateProfilePictureAsync(userId ?? string.Empty, request);
            return Ok(response);
        }

    }
}
