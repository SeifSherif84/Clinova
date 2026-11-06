using Domain.Entities.BusinessEntities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.Abstractions;
using Shared.Dtos.Reviews;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Presentation.Controllers.Reviews
{
    [ApiController]
    [Route("api/reviews")]
    public class ReviewsController(IServiceManager _serviceManager) : ControllerBase
    {
        [Authorize(Roles = "Patient")]
        [HttpPost("appointments/{appointmentId}/submit")] // Post api/reviews/appointment/{appointmentId}/submit
        public async Task<IActionResult> PatientSubmitReview([FromRoute] int appointmentId, 
                                                             [FromBody] CreateReviewRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ReviewService.PatientSubmitReviewAsync(userId ?? string.Empty, appointmentId, request);
            return Ok(response);
        }


        [Authorize(Roles = "Patient")]
        [HttpPatch("{reviewId}/appointments/{appointmentId}")] // Patch api/reviews/{reviewId}/appointments/{appointmentId}
        public async Task<IActionResult> PatientUpdateReview([FromRoute] int reviewId,
                                                             [FromRoute] int appointmentId,
                                                             [FromBody] UpdateReviewRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ReviewService.PatientUpdateReviewAsync(userId ?? string.Empty, reviewId, appointmentId, request);
            return Ok(response);
        }


        [Authorize(Roles = "Patient")]
        [HttpDelete("{reviewId}/appointments/{appointmentId}")] // Delete api/reviews/{reviewId}/appointments/{appointmentId}
        public async Task<IActionResult> PatientDeleteReview([FromRoute] int reviewId,
                                                             [FromRoute] int appointmentId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ReviewService.PatientDeleteReviewAsync(userId ?? string.Empty, reviewId, appointmentId);
            return Ok(response);
        }


        [Authorize(Roles = "Patient")]
        [HttpGet("my-reviews")] // Get api/reviews/my-reviews
        public async Task<IActionResult> PatientGetHisOwnReviews()
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ReviewService.PatientGetHisOwnReviewsAsync(userId ?? string.Empty);
            return Ok(response);
        }


        [Authorize(Roles = "Patient")]
        [HttpGet("doctors/{doctorId}")] // Get api/reviews/doctors/{doctorId}?pageIndex=1&pageSize=10
        public async Task<IActionResult> PatientGetDoctorReviews([FromRoute] string doctorId,
                                                                 [FromQuery] int pageIndex = 1,
                                                                 [FromQuery] int pageSize = 10)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ReviewService.PatientGetDoctorReviewsAsync(userId ?? string.Empty, doctorId, pageIndex, pageSize);
            return Ok(response);
        }


        [Authorize(Roles = "Patient")]
        [HttpGet("doctors/{doctorId}/rating-summary")]
        public async Task<IActionResult> PatientGetDoctorRatingSummary([FromRoute] string doctorId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ReviewService.PatientGetDoctorRatingSummaryAsync(userId ?? string.Empty, doctorId);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpGet("my-reviews/management")]
        public async Task<IActionResult> DoctorGetHisOwnReviews([FromQuery] int pageIndex = 1,
                                                                [FromQuery] int pageSize = 10)
        {
            var doctorId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ReviewService.DoctorGetHisOwnReviewsAsync(doctorId ?? string.Empty, pageIndex, pageSize);
            return Ok(response);
        }
    }
}
