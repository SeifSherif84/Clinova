using Domain.Entities.BusinessEntities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.Abstractions;
using Shared.Dtos.WorkingHours;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Presentation.Controllers.WorkingHours
{
    [ApiController]
    [Route("api/working-hours")]
    public class WorkingHoursController(IServiceManager _serviceManager) : ControllerBase
    {
        [Authorize(Roles = "Doctor")] 
        [HttpPost("clinic/{clinicId}")] // Post api/working-hours/clinic/{clinicId} 
        public async Task<IActionResult> CreateWorkingHours([FromRoute] int clinicId, [FromBody] CreateWorkingHourRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.WorkingHourService.CreateWorkingHoursAsync(userId ?? string.Empty, clinicId, request);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpPatch("{workingHourId}/clinic/{clinicId}")] // Patch api/working-hours/{workingHourId}/clinic/{clinicId}
        public async Task<IActionResult> UpdateWorkingHours([FromRoute] int workingHourId, [FromRoute] int clinicId, [FromBody] UpdateWorkingHourRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.WorkingHourService.UpdateWorkingHoursAsync(userId ?? string.Empty, workingHourId, clinicId, request);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpDelete("{workingHourId}/clinic/{clinicId}")] // Delete api/working-hours/{workingHourId}/clinic/{clinicId}
        public async Task<IActionResult> DeleteWorkingHours([FromRoute] int workingHourId, [FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.WorkingHourService.DeleteWorkingHoursAsync(userId ?? string.Empty, workingHourId, clinicId);
            return Ok(response);
        }



        [Authorize(Roles = "Doctor")]
        [HttpGet("clinic/{clinicId}")] // Get api/working-hours/clinic/{clinicId}
        public async Task<IActionResult> GetWorkingHours([FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.WorkingHourService.GetWorkingHoursAsync(userId ?? string.Empty, clinicId);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpPatch("{workingHourId}/clinic/{clinicId}/activate")] // PATCH /working-hours/{workingHourId}/clinic/{clinicId}/activate
        public async Task<IActionResult> ActivateWorkingHour([FromRoute] int workingHourId, [FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.WorkingHourService.ActivateWorkingHourAsync(userId ?? string.Empty, workingHourId, clinicId);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpPatch("{workingHourId}/clinic/{clinicId}/deactivate")] // PATCH /working-hours/{workingHourId}/clinic/{clinicId}/deactivate
        public async Task<IActionResult> DeactivateWorkingHour([FromRoute] int workingHourId, [FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.WorkingHourService.DeactivateWorkingHourAsync(userId ?? string.Empty, workingHourId, clinicId);
            return Ok(response);
        }


    }
}
