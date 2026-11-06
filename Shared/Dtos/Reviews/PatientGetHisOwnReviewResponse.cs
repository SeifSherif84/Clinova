using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Reviews
{
    public class PatientGetHisOwnReviewResponse
    {
        public int ReviewId { get; set; }
        public int AppointmentId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public bool IsAnonymous { get; set; }
        public string Status { get; set; } = null!;
        public DateTime CreatedAt { get; set; }

        public string DoctorId { get; set; } = null!;
        public string DoctorName { get; set; } = null!;
        public string ClinicName { get; set; } = null!;
    }
}
