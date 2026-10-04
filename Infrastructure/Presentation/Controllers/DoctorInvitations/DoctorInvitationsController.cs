using Domain.Entities.BusinessEntities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.Abstractions;
using Shared.Dtos.DoctorInvitations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Presentation.Controllers.DoctorInvitations
{
    [ApiController]
    [Route("api/doctor-invitations")]
    public class DoctorInvitationsController(IServiceManager _serviceManager) : ControllerBase
    {

        [Authorize(Roles = "Doctor")]
        [HttpPost("send/clinic/{clinicId}")] // Post api/invitations/send/clinic/{clinicId}
        public async Task<IActionResult> SendDoctorInvitation([FromRoute] int clinicId, [FromBody] SendDoctorInvitationRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
            var response = await _serviceManager.InvitationService.SendDoctorInvitationAsync(userId ?? string.Empty, clinicId, request);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpGet("sent")] // Get api/invitations/sent
        public async Task<IActionResult> GetSentDoctorInvitations()
        {
            var userId = HttpContext.User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
            var response = await _serviceManager.InvitationService.GetSentDoctorInvitationsAsync(userId ?? string.Empty);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpGet("received")] // Get api/invitations/received
        public async Task<IActionResult> GetReceivedDoctorInvitations()
        {
            var userId = HttpContext.User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
            var response = await _serviceManager.InvitationService.GetReceivedDoctorInvitationsAsync(userId ?? string.Empty);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpPost("accept/{doctorInvitationId}")] // Post api/invitations/accept/{doctorInvitationId}
        public async Task<IActionResult> AcceptDoctorInvitation([FromRoute] int doctorInvitationId)
        {
            var userId = HttpContext.User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
            var response = await _serviceManager.InvitationService.AcceptDoctorInvitationAsync(userId ?? string.Empty, doctorInvitationId);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpPost("reject/{doctorInvitationId}")] // Post api/invitations/reject/{doctorInvitationId}
        public async Task<IActionResult> RejectDoctorInvitation([FromRoute] int doctorInvitationId)
        {
            var userId = HttpContext.User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
            var response = await _serviceManager.InvitationService.RejectDoctorInvitationAsync(userId ?? string.Empty, doctorInvitationId);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpPost("cancel/{doctorInvitationId}")] // Post api/invitations/cancel/{doctorInvitationId}
        public async Task<IActionResult> CancelDoctorInvitation([FromRoute] int doctorInvitationId)
        {
            var userId = HttpContext.User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
            var response = await _serviceManager.InvitationService.CancelDoctorInvitationAsync(userId ?? string.Empty, doctorInvitationId);
            return Ok(response);
        }

    }
}
