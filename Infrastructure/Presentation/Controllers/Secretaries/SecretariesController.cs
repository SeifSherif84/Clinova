using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.Abstractions;
using Shared.Dtos.Patients;
using Shared.Dtos.Secretaries;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Presentation.Controllers.Secretaries
{
    [ApiController]
    [Route("api/secretaries")]
    public class SecretariesController(IServiceManager _serviceManager) : ControllerBase
    {
        [Authorize(Roles = "Secretary")]
        [HttpGet("me")] // Get api/secretaries/me
        public async Task<IActionResult> GetProfile()
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.SecretaryService.GetProfileAsync(userId ?? string.Empty);
            return Ok(response);
        }


        [Authorize(Roles = "Secretary")]
        [HttpPatch("me")] // Patch api/secretaries/me
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateSecretaryProfileRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.SecretaryService.UpdateProfileAsync(userId ?? string.Empty, request);
            return Ok(response);
        }


        [Authorize(Roles = "Secretary")]
        [HttpPatch("me/profile-picture")] // Patch api/secretaries/me/profile-picture
        public async Task<IActionResult> UpdateProfilePicture([FromForm] UpdateSecretaryProfilePictureRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.SecretaryService.UpdateProfilePictureAsync(userId ?? string.Empty, request);
            return Ok(response);
        }
    }
}
