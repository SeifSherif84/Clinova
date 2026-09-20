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

    }
}
