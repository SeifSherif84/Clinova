using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Presentation.Controllers.Enums
{
    [ApiController]
    [Route("api/lookups")]
    public class LookupsController(IServiceManager _serviceManager)  : ControllerBase
    {
        [Authorize]
        [HttpGet("genders")]
        public IActionResult GetGenders()
        {
            var response = _serviceManager.LookupsService.GetGenders();
            return Ok(response);
        }


        [Authorize]
        [HttpGet("medical-specialties")]
        public async Task<IActionResult> GetMedicalSpecialties()
        {
            var response = await _serviceManager.LookupsService.GetMedicalSpecialtiesAsync();
            return Ok(response);
        }


        [Authorize]
        [HttpGet("governorates")]
        public async Task<IActionResult> GetGovernorates()
        {
            var response = await _serviceManager.LookupsService.GetGovernoratesAsync();
            return Ok(response);
        }


        [Authorize]
        [HttpGet("regions")]
        public async Task<IActionResult> GetRegions([FromQuery] int governorateId)
        {
            var response = await _serviceManager.LookupsService.GetRegionsAsync(governorateId);
            return Ok(response);
        }



    }
}
