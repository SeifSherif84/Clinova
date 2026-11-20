using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Reviews
{
    public class AdminReviewResponse
    {
        public int ReviewId { get; set; }
        public string PatientName { get; set; } = null!;
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public string Status { get; set; } = null!;
        public bool IsAnonymous { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
