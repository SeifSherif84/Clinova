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
        public async Task<IActionResult> Login(LoginRequest loginRequest)
        {
            var Response = await _serviceManager.AuthService.LoginAsync(loginRequest);
            return Ok(Response);
        }


        [HttpGet("Confirm-Email")]
        public async Task<IActionResult> ConfirmEmail([FromQuery] string email, [FromQuery] string token)
        {
            await _serviceManager.AuthService.ConfirmEmailAsync(email, token);
            return Ok();
        }


        [HttpPost("refresh-Token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest refreshTokenRequest)
        {
            var response = await _serviceManager.AuthService.RefreshTokenAsync(refreshTokenRequest);
            return Ok(response);
        }

    }
}
