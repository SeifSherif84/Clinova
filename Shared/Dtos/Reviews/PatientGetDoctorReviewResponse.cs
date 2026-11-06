using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Reviews
{
    public class PatientGetDoctorReviewResponse
    {
        public int ReviewId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public bool IsAnonymous { get; set; }
        public string PatientName { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
    }
}
