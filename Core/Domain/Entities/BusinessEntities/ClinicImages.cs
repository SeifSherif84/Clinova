using Domain.Entities.BusinessEntities;
using Domain.Entities.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class ClinicImages : BaseEntity<int>
    {
        public string Image { get; set; } = null!;

        public int ClinicId { get; set; }
        public Clinic Clinic { get; set; } = null!;
    }
}
