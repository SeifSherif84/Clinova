using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.ClinovaSettings
{
    public class CancellationPolicySettings
    {
        /// <summary>
        /// Patient receives a full refund if the appointment
        /// is cancelled at least this many minutes before
        /// the appointment start time.
        /// Example: 120 minutes = 2 hours.
        /// </summary>
        public int FullRefundCancellationWindowMinutes { get; set; }

        /// <summary>
        /// Patient receives a full refund if the appointment
        /// is cancelled within this many minutes from booking,
        /// regardless of the appointment start time.
        /// Example: 10 minutes.
        /// </summary>
        public int BookingCancellationGracePeriodMinutes { get; set; }
    }
}
