using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Services.Abstractions;
using Shared.Dtos.DepositPayments;
using Shared.Dtos.Paymob;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Presentation.Controllers.DepositPayments
{
    [ApiController]
    [Route("api/payments")]
    public class DepositPaymentsController(IServiceManager _serviceManager) : ControllerBase
    {
        [Authorize(Roles = "Patient")]
        [HttpPost("appointments/{appointmentId}/paymob-intention")]
        public async Task<IActionResult> CreatePaymobPaymentIntention([FromRoute] int appointmentId,
                                                                      [FromBody] CreatePaymobPaymentIntentionRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.DepositPaymentService.CreatePaymobPaymentIntentionAsync(userId ?? string.Empty, appointmentId, request);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpGet("configuration/clinics/{clinicId}")]
        public async Task<IActionResult> GetPaymentConfigurationStatus([FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.DepositPaymentService.GetPaymentConfigurationStatusAsync(userId ?? string.Empty, clinicId);
            return Ok(response);
        }



        [AllowAnonymous]
        [HttpPost("paymob/transaction-callback")]
        public async Task<IActionResult> TransactionCallback([FromBody] PaymobTransactionCallbackRequest request,
                                                             [FromQuery] string? hmac)
        {
            await _serviceManager.DepositPaymentService.HandlePaymobTransactionCallbackAsync(request, hmac ?? string.Empty);
            return Ok();
        }
    }
}
