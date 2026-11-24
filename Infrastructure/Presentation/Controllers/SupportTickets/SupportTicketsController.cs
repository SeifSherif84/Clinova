using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.Abstractions;
using Shared.Dtos.SupportTickets;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Presentation.Controllers.SupportTickets
{
    [Route("api/support-tickets")]
    [ApiController]
    public class SupportTicketsController(IServiceManager _serviceManager) : ControllerBase
    {
        [Authorize(Roles = "Patient")]
        [HttpPost] // POST api/support-tickets
        public async Task<IActionResult> PatientCreateSupportTicket([FromBody] PatientCreateSupportTicketRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.SupportTicketService.PatientCreateSupportTicketAsync(userId ?? string.Empty, request);
            return Ok(response);
        }


        [Authorize(Roles = "Patient")]
        [HttpGet("my-tickets")] // GET api/support-tickets/my-tickets
        public async Task<IActionResult> PatientGetHisOwnSupportTickets()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.SupportTicketService.PatientGetHisOwnSupportTicketsAsync(userId ?? string.Empty);
            return Ok(response);
        }


        [Authorize(Roles = "Patient,Admin")]
        [HttpPost("{ticketId:int}/messages")]    
        public async Task<IActionResult> SendSupportTicketMessage([FromRoute] int ticketId, 
                                                                  [FromBody] SendSupportTicketMessageRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.SupportTicketService.SendSupportTicketMessageAsync(userId ?? string.Empty, ticketId, request);
            return Ok(response);
        }


        [Authorize(Roles = "Admin")]
        [HttpGet("admin")] // GET api/support-tickets/admin
        public async Task<IActionResult> AdminGetSupportTickets([FromQuery] AdminSupportTicketQuery query)
        {
            var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.SupportTicketService.AdminGetSupportTicketsAsync(adminId ?? string.Empty, query);
            return Ok(response);
        }


        [Authorize(Roles = "Admin")]
        [HttpGet("{ticketId:int}/admin")] // GET api/support-tickets/{ticketId}/admin
        public async Task<IActionResult> AdminGetSupportTicketDetails([FromRoute] int ticketId)
        {
            var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.SupportTicketService.AdminGetSupportTicketDetailsAsync(adminId ?? string.Empty, ticketId);
            return Ok(response);
        }


        [Authorize(Roles = "Admin")]
        [HttpPatch("{ticketId:int}/admin")] // PATCH api/support-tickets/{ticketId}/admin
        public async Task<IActionResult> AdminUpdateSupportTicketStatus([FromRoute] int ticketId,
                                                                        [FromBody] AdminUpdateSupportTicketStatusRequest request)
        {
            var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.SupportTicketService.AdminUpdateSupportTicketStatusAsync(adminId ?? string.Empty, ticketId, request);
            return Ok(response);
        }
    }
}
