using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.Abstractions;
using Shared.Dtos.Auth;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Presentation.Controllers.Auth
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController(IServiceManager _serviceManager) : ControllerBase
    {

        [HttpPost("doctor-registration")] 
        public async Task<IActionResult> DoctorRegistration([FromForm] DoctorRegistrationRequest request)
        {
            // Call the AuthService to handle doctor registration
            var response = await _serviceManager.AuthService.DoctorRegistrationAsync(request);
            return Ok(response);
        }


        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var response = await _serviceManager.AuthService.LoginAsync(request);
            return Ok(response);
        }



        [HttpGet("confirm-email")]
        public async Task<IActionResult> ConfirmEmail([FromQuery] string email, [FromQuery] string token)
        {
            var response = await _serviceManager.AuthService.ConfirmEmailAsync(email, token);
            return Ok(response);
        }



        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            var response = await _serviceManager.AuthService.RefreshTokenAsync(request);
            return Ok(response);
        }



        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordByEmailRequest request)
        {
            var response = await _serviceManager.AuthService.ResetPaswordByEmailAsync(request);
            return Ok(response);
        }



        [HttpPost("update-password")]
        public async Task<IActionResult> UpdatePassword([FromQuery] string email,
                                                        [FromQuery] string token,
                                                        [FromBody] UpdatePasswordRequest request)
        {
            var response = await _serviceManager.AuthService.UpdatePasswordAsync(email, token, request);
            return Ok(response);
        }


        [HttpPost("resend-email-confirmation")]
        public async Task<IActionResult> ResendEmailConfirmation([FromBody] ResendEmailConfirmationRequest request)
        {
            var response = await _serviceManager.AuthService.ResendEmailConfirmationAsync(request);
            return Ok(response);
        }



        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AuthService.LogoutAsync(userId ?? string.Empty);
            return Ok(response);
        }



        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AuthService.ChangePasswordAsync(userId ?? string.Empty, request);
            return Ok(response);
        }


        [HttpPost("patient-registration")]
        public async Task<IActionResult> PatientRegistration([FromBody] PatientRegistrationRequest request)
        {
            var response = await _serviceManager.AuthService.PatientRegistrationAsync(request);
            return Ok(response);
        }


        [Authorize]
        [HttpDelete("account")]
        public async Task<IActionResult> DeleteAccount()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.AuthService.DeleteAccountAsync(userId ?? string.Empty);
            return Ok(response);
        }

    }
}
