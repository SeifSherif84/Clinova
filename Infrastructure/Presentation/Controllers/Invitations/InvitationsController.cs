using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.Abstractions;
using Shared.Dtos.Invitations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Presentation.Controllers.Invitations
{
    [ApiController]
    [Route("api/invitations")]
    public class InvitationsController(IServiceManager _serviceManager) : ControllerBase
    {

        [Authorize(Roles = "Doctor")]
        [HttpPost("send/clinic/{clinicId}")] // Post api/invitations/send/clinic/{clinicId}
        public async Task<IActionResult> SendInvitation(int clinicId, [FromBody] SendInvitationRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
            var response = await _serviceManager.InvitationService.SendInvitationAsync(userId ?? string.Empty, clinicId, request);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpGet("sent")] // Get api/invitations/sent
        public async Task<IActionResult> GetSentInvitationsAsync()
        {
            var userId = HttpContext.User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
            var response = await _serviceManager.InvitationService.GetSentInvitationsAsync(userId ?? string.Empty);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpGet("received")] // Get api/invitations/received
        public async Task<IActionResult> GetReceivedInvitationsAsync()
        {
            var userId = HttpContext.User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
            var response = await _serviceManager.InvitationService.GetReceivedInvitationsAsync(userId ?? string.Empty);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpPost("accept/{invitationId}")] // Post api/invitations/accept/{invitationId}
        public async Task<IActionResult> AcceptInvitationAsync(int invitationId)
        {
            var userId = HttpContext.User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
            var response = await _serviceManager.InvitationService.AcceptInvitationAsync(userId ?? string.Empty, invitationId);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpPost("reject/{invitationId}")] // Post api/invitations/reject/{invitationId}
        public async Task<IActionResult> RejectInvitationAsync(int invitationId)
        {
            var userId = HttpContext.User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
            var response = await _serviceManager.InvitationService.RejectInvitationAsync(userId ?? string.Empty, invitationId);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpPost("cancel/{invitationId}")] // Post api/invitations/cancel/{invitationId}
        public async Task<IActionResult> CancelInvitationAsync(int invitationId)
        {
            var userId = HttpContext.User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
            var response = await _serviceManager.InvitationService.CancelInvitationAsync(userId ?? string.Empty, invitationId);
            return Ok(response);
        }

    }
}
