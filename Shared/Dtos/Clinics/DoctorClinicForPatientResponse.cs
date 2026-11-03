using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Clinics
{
    public class DoctorClinicForPatientResponse
    {
        public int ClinicId { get; set; }
        public string ClinicName { get; set; } = null!;
        public string StreetName { get; set; } = null!;
        public string RegionName { get; set; } = null!;
        public string GovernorateName { get; set; } = null!;
        public decimal ConsultationFee { get; set; }
        public decimal DepositPercentage { get; set; }
        public decimal DepositAmount { get; set; }
        public decimal RemainingAmount { get; set; }
    }
}
