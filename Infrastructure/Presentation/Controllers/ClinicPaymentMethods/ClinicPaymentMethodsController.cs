using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.Abstractions;
using Shared.Dtos.ClinicPaymentMethods;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Presentation.Controllers.ClinicPaymentMethods
{
    [ApiController]
    [Route("api/clinic-payment-methods")]
    public class ClinicPaymentMethodsController(IServiceManager _serviceManager) : ControllerBase
    {
        [Authorize(Roles = "Doctor")]
        [HttpPost("clinics/{clinicId}")]
        public async Task<IActionResult> AddClinicPaymentMethod([FromRoute] int clinicId,
                                                                [FromBody] AddClinicPaymentMethodRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicPaymentMethodService.AddClinicPaymentMethodAsync(userId ?? string.Empty, clinicId, request);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpPatch("{paymentMethodId}/clinics/{clinicId}")]
        public async Task<IActionResult> UpdateClinicPaymentMethod([FromRoute] int clinicId,
                                                                   [FromRoute] int paymentMethodId,
                                                                   [FromBody] UpdateClinicPaymentMethodRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicPaymentMethodService.UpdateClinicPaymentMethodAsync(userId ?? string.Empty, clinicId, paymentMethodId, request);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpDelete("{paymentMethodId}/clinics/{clinicId}")]
        public async Task<IActionResult> DeleteClinicPaymentMethod([FromRoute] int clinicId,
                                                           [FromRoute] int paymentMethodId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicPaymentMethodService.DeleteClinicPaymentMethodAsync(userId ?? string.Empty, clinicId, paymentMethodId);
            return Ok(response);
        }


        [Authorize(Roles = "Patient")]
        [HttpGet("clinics/{clinicId}")]
        public async Task<IActionResult> GetClinicPaymentMethodsForPatient([FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicPaymentMethodService.GetClinicPaymentMethodsForPatientAsync(userId ?? string.Empty, clinicId);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpGet("clinics/{clinicId}/management")]
        public async Task<IActionResult> GetClinicPaymentMethodsForOwner([FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicPaymentMethodService.GetClinicPaymentMethodsForOwnerAsync(userId ?? string.Empty, clinicId);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpPatch("{paymentMethodId}/clinics/{clinicId}/activate")]
        public async Task<IActionResult> ActivateClinicPaymentMethod([FromRoute] int clinicId,
                                                                     [FromRoute] int paymentMethodId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicPaymentMethodService.ActivateClinicPaymentMethodAsync(userId ?? string.Empty, clinicId, paymentMethodId);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpPatch("{paymentMethodId}/clinics/{clinicId}/deactivate")]
        public async Task<IActionResult> DeactivateClinicPaymentMethod([FromRoute] int clinicId,
                                                                       [FromRoute] int paymentMethodId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicPaymentMethodService.DeactivateClinicPaymentMethodAsync(userId ?? string.Empty, clinicId, paymentMethodId);
            return Ok(response);
        }

    }
}
