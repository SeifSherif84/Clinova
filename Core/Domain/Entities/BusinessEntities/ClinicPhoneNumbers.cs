using Domain.Entities.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.BusinessEntities
{
    public class ClinicPhoneNumbers : BaseEntity<int>
    {
        public string PhoneNumber { get; set; } = null!;
        public int ClinicId { get; set; }
        public Clinic Clinic { get; set; } = null!;
    }
}
