using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.Abstractions;
using Shared.Dtos.Paymob;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Presentation.Controllers.PaymobWebhook
{
    [ApiController]
    [Route("api/payments/paymob")]
    public class PaymobWebhookController(IServiceManager _serviceManager) : ControllerBase
    {
        [AllowAnonymous]
        [HttpPost("transaction-callback")]
        public async Task<IActionResult> TransactionCallback([FromBody] PaymobTransactionCallbackRequest request,
                                                             [FromQuery] string? hmac)
        {
            await _serviceManager.PaymentService.HandlePaymobTransactionCallbackAsync(request, hmac ?? string.Empty);
            return Ok();
        }
    }
}
