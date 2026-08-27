using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Shared.Dtos.Lookups;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.Lookups
{
    public interface ILookupsService
    {
        IEnumerable<LookupResponse> GetGenders();
        Task<IEnumerable<LookupResponse>> GetMedicalSpecialtiesAsync();
        Task<IEnumerable<LookupResponse>> GetGovernoratesAsync();
        Task<IEnumerable<LookupResponse>> GetRegionsAsync(int governorateId);

    }
}
