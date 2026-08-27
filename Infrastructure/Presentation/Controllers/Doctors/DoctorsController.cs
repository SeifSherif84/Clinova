using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.Abstractions;
using Shared.Dtos.Doctors;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Presentation.Controllers.Doctors
{
    [ApiController]
    [Route("api/doctors")]
    public class DoctorsController(IServiceManager _serviceManager) : ControllerBase
    {
        [Authorize]
        [HttpGet("my-profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.DoctorService.GetProfileAsync(userId ?? string.Empty);
            return Ok(response);
        }

        [Authorize]
        [HttpPatch("my-profile")]
        public async Task<IActionResult> UpdateProfile(UpdateDoctorProfileRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.DoctorService.UpdateProfileAsync(userId ?? string.Empty, request);
            return Ok(response);
        }

        [Authorize]
        [HttpPatch("profile-picture")]
        public async Task<IActionResult> UpdateProfilePicture(UpdateDoctorProfilePictureRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.DoctorService.UpdateProfilePictureAsync(userId ?? string.Empty, request);
            return Ok(response);
        }


    }
}
