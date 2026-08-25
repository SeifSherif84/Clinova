using Microsoft.AspNetCore.Mvc;
using Services.Abstractions;
using Shared.Dtos.Auth;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Presentation.Controllers.Auth
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController(IServiceManager _serviceManager) : ControllerBase
    {

        [HttpPost("doctor-registration")] 
        public async Task<IActionResult> DoctorRegistration([FromForm] DoctorRegistrationRequest doctorRegisterRequest)
        {
            // Call the AuthService to handle doctor registration
            var response = await _serviceManager.AuthService.DoctorRegistrationAsync(doctorRegisterRequest);
            return Ok(response);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest loginRequest)
        {
            var Response = await _serviceManager.AuthService.LoginAsync(loginRequest);
            return Ok(Response);
        }


        [HttpGet("confirm-email")]
        public async Task<IActionResult> ConfirmEmail([FromQuery] string email, [FromQuery] string token)
        {
            var response = await _serviceManager.AuthService.ConfirmEmailAsync(email, token);
            return Ok(response);
        }


        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest refreshTokenRequest)
        {
            var response = await _serviceManager.AuthService.RefreshTokenAsync(refreshTokenRequest);
            return Ok(response);
        }


        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordByEmail resetPasswordByEmail)
        {
            var response = await _serviceManager.AuthService.ResetPaswordByEmailAsync(resetPasswordByEmail);
            return Ok(response);
        }


        [HttpPost("update-password")]
        public async Task<IActionResult> UpdatePassword([FromQuery] string email,
                                                        [FromQuery] string token,
                                                        [FromBody] UpdatePasswordRequest updatePasswordRequest)
        {
            var response = await _serviceManager.AuthService.UpdatePasswordAsync(email, token, updatePasswordRequest);
            return Ok(response);
        }

    }
}
