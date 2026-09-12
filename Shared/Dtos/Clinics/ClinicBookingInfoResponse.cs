using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Clinics
{
    public class ClinicBookingInfoResponse
    {
        public decimal ConsultationFee { get; set; }
        public decimal DepositPercentage { get; set; }
        public decimal DepositAmount { get; set; }
        public decimal RemainingAmount { get; set; }
    }
}
