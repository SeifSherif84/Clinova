using Domain.Entities.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.BusinessEntities
{
    public class Region : BaseEntity<int>
    {
        public string Name { get; set; } = null!;

        public int GovernorateId { get; set; }
        public Governorate Governorate { get; set; } = null!;


        public ICollection<Clinic> Clinics { get; set; } = new List<Clinic>();
    }
}
