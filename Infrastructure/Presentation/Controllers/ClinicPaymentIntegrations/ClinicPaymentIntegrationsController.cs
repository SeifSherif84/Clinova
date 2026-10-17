using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.Abstractions;
using Shared.Dtos.ClinicPaymentIntegrations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Presentation.Controllers.ClinicPaymentIntegrations
{
    [ApiController]
    [Route("api/integrations")]
    public class ClinicPaymentIntegrationsController(IServiceManager _serviceManager) : ControllerBase
    {
        [Authorize(Roles = "Doctor")]
        [HttpPost("online-payment-accounts/{accountId}/clinics/{clinicId}")]
        public async Task<IActionResult> AddPaymentIntegration([FromRoute] int accountId,
                                                               [FromRoute] int clinicId,
                                                               [FromBody] AddClinicPaymentIntegrationRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicPaymentIntegrationService.AddPaymentIntegrationForPaymobAccountAsync(userId ?? string.Empty, accountId, clinicId, request);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpPatch("{integrationId}/online-payment-accounts/{accountId}/clinics/{clinicId}")]
        public async Task<IActionResult> UpdatePaymentIntegration([FromRoute] int integrationId,
                                                                  [FromRoute] int accountId,
                                                                  [FromRoute] int clinicId,
                                                                  [FromBody] UpdateClinicPaymentIntegrationRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicPaymentIntegrationService.UpdatePaymentIntegrationAsync(userId ?? string.Empty, integrationId, accountId, clinicId, request);
            return Ok(response);
        }




        [Authorize(Roles = "Doctor")]
        [HttpDelete("{integrationId}/online-payment-accounts/{accountId}/clinics/{clinicId}")]
        public async Task<IActionResult> DeletePaymentIntegration([FromRoute] int integrationId,
                                                                  [FromRoute] int accountId,
                                                                  [FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicPaymentIntegrationService.DeletePaymentIntegrationAsync(userId ?? string.Empty, integrationId, accountId, clinicId);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpPatch("{integrationId}/online-payment-accounts/{accountId}/clinics/{clinicId}/activate")]
        public async Task<IActionResult> ActivatePaymentIntegration([FromRoute] int integrationId, 
                                                                    [FromRoute] int accountId,
                                                                    [FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicPaymentIntegrationService.ActivatePaymentIntegrationAsync(userId ?? string.Empty, integrationId, accountId, clinicId);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpPatch("{integrationId}/online-payment-accounts/{accountId}/clinics/{clinicId}/deactivate")]
        public async Task<IActionResult> DeactivatePaymentIntegration([FromRoute] int integrationId, 
                                                                      [FromRoute] int accountId,
                                                                      [FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicPaymentIntegrationService.DeactivatePaymentIntegrationAsync(userId ?? string.Empty, integrationId, accountId, clinicId);
            return Ok(response);
        }




    }
}
