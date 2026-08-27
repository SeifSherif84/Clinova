using Domain.Entities.BusinessEntities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Specifications.Regions
{
    public class RegionsByGovernorateSpecification : BaseSpecifications<Region, int>
    {
        public RegionsByGovernorateSpecification(int governorateId) : base()
        {
            ApplyCriteria(governorateId);
        }

        private void ApplyCriteria(int governorateId)
        {
            Criteria = region => region.GovernorateId == governorateId; 
        }
    }
}
