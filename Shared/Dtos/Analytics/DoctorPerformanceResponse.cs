using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Analytics
{
    public class DoctorPerformanceResponse
    {
        public List<DoctorPerformanceItemResponse> Doctors { get; set; } = new List<DoctorPerformanceItemResponse>();
    }
}
