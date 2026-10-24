using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.Abstractions;
using Shared.Dtos.Analytics;
using System.Security.Claims;

namespace Presentation.Controllers.Analytics
{
    [ApiController]
    [Route("api/doctor-analytics")]
    [Authorize(Roles = "Doctor")]
    public class DoctorAnalyticsController(IServiceManager _serviceManager) : ControllerBase
    {
        [HttpGet("clinics/{clinicId}/financial-overview")]
        public async Task<IActionResult> GetFinancialOverview([FromRoute] int clinicId, [FromQuery] AnalyticsDateRangeQuery query)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.DoctorAnalyticsService.GetFinancialOverviewAsync(userId ?? string.Empty, clinicId, query);
            return Ok(response);
        }

        [HttpGet("clinics/{clinicId}/appointment-overview")]
        public async Task<IActionResult> GetAppointmentOverview([FromRoute] int clinicId, [FromQuery] AnalyticsDateRangeQuery query)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.DoctorAnalyticsService.GetAppointmentOverviewAsync(userId ?? string.Empty, clinicId, query);
            return Ok(response);
        }

        [HttpGet("clinics/{clinicId}/doctor-performance-overview")]
        public async Task<IActionResult> GetDoctorPerformance([FromRoute] int clinicId, [FromQuery] AnalyticsDateRangeQuery query)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.DoctorAnalyticsService.GetDoctorPerformanceAsync(userId ?? string.Empty, clinicId, query);
            return Ok(response);
        }
    }
}
