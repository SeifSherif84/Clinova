using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.ClinovaSettings
{
    public class CancellationPolicyResponse
    {
        public int FullRefundCancellationWindowMinutes { get; set; }
        public int BookingCancellationGracePeriodMinutes { get; set; }
        public string FullRefundCancellationDescription { get; set; } = null!;
        public string BookingGracePeriodDescription { get; set; } = null!;
        public string NoRefundDescription { get; set; } = null!;
        public string ClinicCancellationDescription { get; set; } = null!;
    }
}
