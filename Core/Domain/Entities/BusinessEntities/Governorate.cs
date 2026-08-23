using Domain.Entities.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.BusinessEntities
{
    public class Governorate : BaseEntity<int>
    {
        public string Name { get; set; } = null!;
        public ICollection<Region> Regions { get; set; } = new List<Region>();
    }
}
