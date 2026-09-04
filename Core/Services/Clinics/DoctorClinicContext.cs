using Domain.Entities.BusinessEntities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Clinics
{
    public class DoctorClinicContext
    {
        public Doctor Doctor { get; init; } = null!;
        public Clinic Clinic { get; init; } = null!;
        public DoctorClinic DoctorClinic { get; set; } = null!;
        public bool IsOwner { get; set; }
    }
}
