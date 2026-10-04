using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.Abstractions;
using Shared.Dtos.SecretaryInvitations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Presentation.Controllers.SecretaryInvitations
{
    [ApiController]
    [Route("api/secretary-invitations")]
    public class SecretaryInvitationsController(IServiceManager _serviceManager) : ControllerBase
    {
        [Authorize(Roles = "Doctor")]
        [HttpPost("send/clinic/{clinicId}")] // POST api/secretary-invitations/send/clinic/{clinicId}
        public async Task<IActionResult> SendSecretaryInvitation([FromRoute] int clinicId, [FromBody] SendSecretaryInvitationRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.SecretaryInvitationService.SendSecretaryInvitationAsync(userId ?? string.Empty, clinicId, request);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpGet("sent")] // Get api/secretary-invitations/sent
        public async Task<IActionResult> GetSentSecretaryInvitations()
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.SecretaryInvitationService.GetSentSecretaryInvitationsAsync(userId ?? string.Empty);
            return Ok(response);
        }


        [Authorize(Roles = "Secretary")]
        [HttpGet("received")] // Get api/secretary-invitations/received
        public async Task<IActionResult> GetReceivedSecretaryInvitations()
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.SecretaryInvitationService.GetReceivedSecretaryInvitationsAsync(userId ?? string.Empty);
            return Ok(response);
        }



        [Authorize(Roles = "Secretary")]
        [HttpPost("accept/{secretaryInvitationId}")] // Post api/secretary-invitations/accept/{secretaryInvitationId}
        public async Task<IActionResult> AcceptSecretaryInvitation([FromRoute] int secretaryInvitationId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.SecretaryInvitationService.AcceptSecretaryInvitationAsync(userId ?? string.Empty, secretaryInvitationId);
            return Ok(response);
        }


        [Authorize(Roles = "Secretary")]
        [HttpPost("reject/{secretaryInvitationId}")] // Post api/secretary-invitations/reject/{secretaryInvitationId}
        public async Task<IActionResult> RejectSecretaryInvitation([FromRoute] int secretaryInvitationId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.SecretaryInvitationService.RejectSecretaryInvitationAsync(userId ?? string.Empty, secretaryInvitationId);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpPost("cancel/{secretaryInvitationId}")] // Post api/secretary-invitations/cancel/{secretaryInvitationId}
        public async Task<IActionResult> CancelSecretaryInvitation([FromRoute] int secretaryInvitationId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.SecretaryInvitationService.CancelSecretaryInvitationAsync(userId ?? string.Empty, secretaryInvitationId);
            return Ok(response);
        }

    }
}
