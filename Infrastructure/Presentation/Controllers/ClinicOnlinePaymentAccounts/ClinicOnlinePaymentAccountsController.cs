using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.Abstractions;
using Shared.Dtos.ClinicOnlinePaymentAccounts;
using Shared.Dtos.ClinicPaymentIntegrations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Presentation.Controllers.ClinicOnlinePaymentAccounts
{
    [ApiController]
    [Route("api/online-payment-accounts")]
    public class ClinicOnlinePaymentAccountsController(IServiceManager _serviceManager) : ControllerBase
    {
        [Authorize(Roles = "Doctor")]
        [HttpPost("clinics/{clinicId}")]
        public async Task<IActionResult> ConfigurePaymobAccount([FromRoute] int clinicId,
                                                                [FromBody] ConfigurePaymobAccountRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicOnlinePaymentAccountService.ConfigurePaymobAccountAsync(userId ?? string.Empty, clinicId, request);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpPatch("{accountId}/clinics/{clinicId}")]
        public async Task<IActionResult> UpdatePaymobAccount([FromRoute] int accountId,
                                                             [FromRoute] int clinicId,
                                                             [FromBody] UpdatePaymobAccountRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicOnlinePaymentAccountService.UpdatePaymobAccountAsync(userId ?? string.Empty, accountId, clinicId, request);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpGet("clinics/{clinicId}")]
        public async Task<IActionResult> GetPaymentAccounts([FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicOnlinePaymentAccountService.GetPaymentAccountsAsync(userId ?? string.Empty, clinicId);
            return Ok(response);
        }


    }
}
