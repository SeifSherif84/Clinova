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
        [HttpGet("clinics/{clinicId}/financial-overview")] // https://localhost:7269/api/doctor-analytics/clinics/2/financial-overview?fromDate=2023-01-01&toDate=2023-12-31
        public async Task<IActionResult> GetFinancialOverview([FromRoute] int clinicId, [FromQuery] AnalyticsDateRangeQuery query)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.DoctorAnalyticsService.GetFinancialOverviewAsync(userId ?? string.Empty, clinicId, query);
            return Ok(response);
        }

        [HttpGet("clinics/{clinicId}/appointment-overview")] // https://localhost:7269/api/doctor-analytics/clinics/2/appointment-overview?fromDate=2023-01-01&toDate=2023-12-31
        public async Task<IActionResult> GetAppointmentOverview([FromRoute] int clinicId, [FromQuery] AnalyticsDateRangeQuery query)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.DoctorAnalyticsService.GetAppointmentOverviewAsync(userId ?? string.Empty, clinicId, query);
            return Ok(response);
        }

        [HttpGet("clinics/{clinicId}/doctor-performance-overview")] // https://localhost:7269/api/doctor-analytics/clinics/2/doctor-performance-overview?fromDate=2023-01-01&toDate=2023-12-31
        public async Task<IActionResult> GetDoctorPerformance([FromRoute] int clinicId, [FromQuery] AnalyticsDateRangeQuery query)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.DoctorAnalyticsService.GetDoctorPerformanceAsync(userId ?? string.Empty, clinicId, query);
            return Ok(response);
        }
    }
}
