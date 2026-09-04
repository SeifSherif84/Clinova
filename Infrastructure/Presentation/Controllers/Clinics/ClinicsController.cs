using Domain.Entities.BusinessEntities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.Abstractions;
using Shared.Dtos.Clinics;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Presentation.Controllers.Clinics
{
    [ApiController]
    [Route("api/clinics")]
    public class ClinicsController(IServiceManager _serviceManager) : ControllerBase
    {
        [Authorize(Roles = "Doctor")]
        [HttpPost] // Post api/clinics
        public async Task<IActionResult> AddClinic([FromForm] AddClinicRequest request)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicService.AddClinicAsync(userId ?? string.Empty, request);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpPatch("{clinicId}")] // Patch api/clinics/{clinicId}
        public async Task<IActionResult> UpdateClinic([FromBody] UpdateClinicRequest request,
                                                      [FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicService.UpdateClinicAsync(userId ?? string.Empty, clinicId, request);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpDelete("{clinicId}")] // Delete api/clinics/{clinicId}
        public async Task<IActionResult> DeleteClinic([FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicService.DeleteClinicAsync(userId ?? string.Empty, clinicId);
            return Ok(response);
        }



        [Authorize(Roles = "Doctor")]
        [HttpPost("{clinicId}/images")] // Post api/clinics/{clinicId}/images
        public async Task<IActionResult> AddImage([FromForm] AddClinicImagesRequest request,
                                                  [FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicService.AddImageAsync(userId ?? string.Empty, clinicId, request);
            return Ok(response);
        }



        [Authorize(Roles = "Doctor")]
        [HttpDelete("{clinicId}/images/{imageId}")] // Delete api/clinics/{clinicId}/images/{imageId}
        public async Task<IActionResult> DeleteImage([FromRoute] int clinicId, [FromRoute] int imageId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicService.DeleteImageAsync(userId ?? string.Empty, clinicId, imageId);
            return Ok(response);
        }



        [Authorize(Roles = "Doctor")]
        [HttpPost("{clinicId}/phone-numbers")] // Post api/clinics/{clinicId}/phone-numbers
        public async Task<IActionResult> AddPhoneNumber([FromBody] AddClinicPhoneNumberRequest request,
                                                        [FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicService.AddPhoneNumberAsync(userId ?? string.Empty, clinicId, request);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpDelete("{clinicId}/phone-numbers/{phoneNumberId}")] // Delete api/clinics/{clinicId}/phone-numbers/{phoneNumberId}
        public async Task<IActionResult> DeletePhoneNumber([FromRoute] int clinicId, [FromRoute] int phoneNumberId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicService.DeletePhoneNumberAsync(userId ?? string.Empty, clinicId, phoneNumberId);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpGet] // Get api/clinics
        public async Task<IActionResult> GetAllClinics()
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicService.GetAllClinicAsync(userId ?? string.Empty);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpGet("{clinicId}")] // Get api/clinics/{clinicId}
        public async Task<IActionResult> GetClinicDetails([FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicService.GetClinicDetailsAsync(userId ?? string.Empty, clinicId);
            return Ok(response);
        }



        [Authorize(Roles = "Doctor")]
        [HttpDelete("{clinicId}/members/{memberId}")] // Delete api/clinics/{clinicId}/members/{memberId}
        public async Task<IActionResult> RemoveMember([FromRoute] int clinicId, [FromRoute] string memberId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicService.RemoveMemberAsync(userId ?? string.Empty, clinicId, memberId);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpDelete("{clinicId}/members/me")] // Delete api/clinics/{clinicId}/members/me
        public async Task<IActionResult> LeaveClinic([FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicService.LeaveClinicAsync(userId ?? string.Empty, clinicId);
            return Ok(response);
        }



        [Authorize(Roles = "Doctor")]
        [HttpGet("{clinicId}/members")] // Get api/clinics/{clinicId}/members
        public async Task<IActionResult> GetClinicMembers([FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicService.GetClinicMembersAsync(userId ?? string.Empty, clinicId);
            return Ok(response);
        }

    }
}
