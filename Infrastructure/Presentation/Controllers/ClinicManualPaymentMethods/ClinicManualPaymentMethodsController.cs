using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.Abstractions;
using Shared.Dtos.ClinicManualPaymentMethods;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Presentation.Controllers.ClinicManualPaymentMethods
{
    [ApiController]
    [Route("api/manual-payment-methods")]
    public class ClinicManualPaymentMethodsController(IServiceManager _serviceManager) : ControllerBase
    {
        [Authorize(Roles = "Doctor")]
        [HttpPost("clinics/{clinicId}")]
        public async Task<IActionResult> AddClinicManualPaymentMethod([FromRoute] int clinicId,
                                                                      [FromBody]  AddClinicManualPaymentMethodRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicManualPaymentMethodService.AddManualPaymentMethodAsync(userId ?? string.Empty, clinicId, request);
            return Ok(response);
        }



        [Authorize(Roles = "Doctor")]
        [HttpPatch("{paymentMethodId}/clinics/{clinicId}")]
        public async Task<IActionResult> UpdateManualPaymentMethod([FromRoute] int clinicId,
                                                                         [FromRoute] int paymentMethodId,
                                                                         [FromBody] UpdateClinicManualPaymentMethodRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicManualPaymentMethodService.UpdateManualPaymentMethodAsync(userId ?? string.Empty, clinicId, paymentMethodId, request);
            return Ok(response);
        }



        [Authorize(Roles = "Doctor")]
        [HttpDelete("{paymentMethodId}/clinics/{clinicId}")]
        public async Task<IActionResult> DeleteManualPaymentMethod([FromRoute] int clinicId,
                                                                         [FromRoute] int paymentMethodId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicManualPaymentMethodService.DeleteManualPaymentMethodAsync(userId ?? string.Empty, clinicId, paymentMethodId);
            return Ok(response);
        }



        [Authorize(Roles = "Patient")]
        [HttpGet("clinics/{clinicId}")]
        public async Task<IActionResult> GetManualPaymentMethodsForPatient([FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicManualPaymentMethodService.GetManualPaymentMethodsForPatientAsync(userId ?? string.Empty, clinicId);
            return Ok(response);
        }



        [Authorize(Roles = "Doctor")]
        [HttpGet("clinics/{clinicId}/management")]
        public async Task<IActionResult> GetManualPaymentMethodsForOwner([FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicManualPaymentMethodService.GetManualPaymentMethodsForOwnerAsync(userId ?? string.Empty, clinicId);
            return Ok(response);
        }



        [Authorize(Roles = "Doctor")]
        [HttpPatch("{paymentMethodId}/clinics/{clinicId}/activate")]
        public async Task<IActionResult> ActivateManualPaymentMethod([FromRoute] int clinicId,
                                                                           [FromRoute] int paymentMethodId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicManualPaymentMethodService.ActivateManualPaymentMethodAsync(userId ?? string.Empty, clinicId, paymentMethodId);
            return Ok(response);
        }



        [Authorize(Roles = "Doctor")]
        [HttpPatch("{paymentMethodId}/clinics/{clinicId}/deactivate")]
        public async Task<IActionResult> DeactivateManualPaymentMethod([FromRoute] int clinicId,
                                                                             [FromRoute] int paymentMethodId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicManualPaymentMethodService.DeactivateManualPaymentMethodAsync(userId ?? string.Empty, clinicId, paymentMethodId);
            return Ok(response);
        }

    }
}
