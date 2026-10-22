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
        public async Task<IActionResult> GetAllClinicsForDoctor()
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicService.GetAllClinicsForDoctorAsync(userId ?? string.Empty);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpGet("{clinicId}")] // Get api/clinics/{clinicId}
        public async Task<IActionResult> GetClinicDetailsForDoctor([FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicService.GetClinicDetailsForDoctorAsync(userId ?? string.Empty, clinicId);
            return Ok(response);
        }




        [Authorize(Roles = "Secretary")]
        [HttpGet("my-clinic")] // Get api/clinics/my-clinic
        public async Task<IActionResult> GetClinicForSecretary()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _serviceManager.ClinicService.GetClinicForSecretaryAsync(userId ?? string.Empty);
            return Ok(result);
        }

        [Authorize(Roles = "Secretary")]
        [HttpGet("my-clinic/details")] // Get api/clinics/my-clinic/details
        public async Task<IActionResult> GetClinicDetailsForSecretary()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _serviceManager.ClinicService.GetClinicDetailsForSecretaryAsync(userId ?? string.Empty);
            return Ok(result);
        }

        [Authorize(Roles = "Secretary")]
        [HttpGet("members/management")] // Get api/clinics/members/management
        public async Task<IActionResult> GetClinicMembersForSecretary()
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicService.GetClinicMembersForSecretaryAsync(userId ?? string.Empty);
            return Ok(response);
        }





        [Authorize(Roles = "Doctor")]
        [HttpDelete("{clinicId}/members/{memberId}")] // Delete api/clinics/{clinicId}/members/{memberId}
        public async Task<IActionResult> DoctorRemoveMember([FromRoute] int clinicId, [FromRoute] string memberId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicService.DoctorRemoveMemberAsync(userId ?? string.Empty, clinicId, memberId);
            return Ok(response);
        }


        [Authorize(Roles = "Doctor")]
        [HttpDelete("{clinicId}/members/me")] // Delete api/clinics/{clinicId}/members/me
        public async Task<IActionResult> MemberLeaveClinic([FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicService.MemberLeaveClinicAsync(userId ?? string.Empty, clinicId);
            return Ok(response);
        }



        [Authorize(Roles = "Doctor")]
        [HttpGet("{clinicId}/members")] // Get api/clinics/{clinicId}/members
        public async Task<IActionResult> GetClinicMembersForDoctor([FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicService.GetClinicMembersForDoctorAsync(userId ?? string.Empty, clinicId);
            return Ok(response);
        }




        [Authorize(Roles = "Doctor")]
        [HttpDelete("{clinicId}/secretaries/{secretaryId}")] // Delete api/clinics/{clinicId}/secretaries/{secretaryId}
        public async Task<IActionResult> DoctorRemoveSecretary([FromRoute] int clinicId, [FromRoute] string secretaryId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicService.DoctorRemoveSecretaryAsync(userId ?? string.Empty, clinicId, secretaryId);
            return Ok(response);
        }



        [Authorize(Roles = "Secretary")]
        [HttpDelete("{clinicId}/secretaries/me")] // Delete api/clinics/{clinicId}/secretaries/me
        public async Task<IActionResult> SecretaryLeaveClinic([FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicService.SecretaryLeaveClinicAsync(userId ?? string.Empty, clinicId);
            return Ok(response);
        }



        [Authorize(Roles = "Doctor")]
        [HttpGet("{clinicId}/secretaries")] // Get api/clinics/{clinicId}/secretaries
        public async Task<IActionResult> GetClinicSecretariesForDoctor([FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicService.GetClinicSecretariesForDoctorAsync(userId ?? string.Empty, clinicId);
            return Ok(response);
        }



        [Authorize(Roles = "Patient")]
        [HttpGet("{clinicId}/booking-info")] // Get api/clinics/{clinicId}/booking-info
        public async Task<IActionResult> GetClinicBookingInfoForPatientAsync([FromRoute] int clinicId)
        {
            var userId = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await _serviceManager.ClinicService.GetClinicBookingInfoForPatientAsync(userId ?? string.Empty, clinicId);
            return Ok(response);
        }

    }
}
