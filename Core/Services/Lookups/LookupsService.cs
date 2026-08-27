using Domain.Contracts;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Services.Specifications.Regions;
using Shared.Dtos.Lookups;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.Lookups
{
    public class LookupsService(IUnitOfWork _unitOfWork) : ILookupsService
    {
        public IEnumerable<LookupResponse> GetGenders()
        {
            var gendersList = Enum.GetValues<Gender>().ToList();
            var result = gendersList.Select(gender => new LookupResponse
            {
                Id = (int)gender,
                Name = gender.ToString(),
            });
            return result;
        }


        public async Task<IEnumerable<LookupResponse>> GetMedicalSpecialtiesAsync()
        {
            var medicalSpecialties = await _unitOfWork.GetRepository<MedicalSpecialty, int>().GetAllAsync();
            var result = medicalSpecialties.Select(specialty => new LookupResponse()
            {
                Id = specialty.Id,
                Name = specialty.Name,
            });
            return result;
        }

        public async Task<IEnumerable<LookupResponse>> GetGovernoratesAsync()
        {
            var governorates = await _unitOfWork.GetRepository<Governorate, int>().GetAllAsync();
            var result = governorates.Select(governorate => new LookupResponse()
            {
                Id = governorate.Id,
                Name = governorate.Name,
            });
            return result;
        }

        public async Task<IEnumerable<LookupResponse>> GetRegionsAsync(int governorateId)
        {
            var spec = new RegionsByGovernorateSpecification(governorateId);
            var regions = await _unitOfWork.GetRepository<Region, int>().GetAllAsync(spec);
            var result = regions.Select(region => new LookupResponse()
            {
                Id = region.Id,
                Name = region.Name,
            });
            return result;
        }
    }
}
