using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Services.Abstractions;
using Shared.Dtos.Payments;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Presentation.Controllers.Payments
{
    [ApiController]
    [Route("api/payments")]
    public class PaymentsController(IServiceManager _serviceManager) : ControllerBase
    {
        [Authorize(Roles = "Patient")]
        [HttpPost("appointments/{appointmentId}/paymob-intention")]
        public async Task<IActionResult> CreatePaymobPaymentIntention([FromRoute] int appointmentId,
                                                                      [FromBody] CreatePaymobPaymentIntentionRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.PaymentService.CreatePaymobPaymentIntentionAsync(userId ?? string.Empty, appointmentId, request);
            return Ok(response);
        }
    }
}
