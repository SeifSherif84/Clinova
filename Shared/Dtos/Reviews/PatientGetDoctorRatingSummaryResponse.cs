using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Reviews
{
    public class PatientGetDoctorRatingSummaryResponse
    {
        public string DoctorId { get; set; } = null!;
        public int TotalReviews { get; set; }
        public double AverageRating { get; set; }
        public RatingBreakdownResponse RatingBreakdown { get; set; } = new();
    }
}
