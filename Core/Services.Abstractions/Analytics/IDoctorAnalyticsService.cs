using Shared.Dtos.Analytics;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.Analytics
{
    public interface IDoctorAnalyticsService
    {
        Task<FinancialOverviewResponse> GetFinancialOverviewAsync(string doctorId, int clinicId, AnalyticsDateRangeQuery query);
        Task<AppointmentOverviewResponse> GetAppointmentOverviewAsync(string doctorId, int clinicId, AnalyticsDateRangeQuery query);
        Task<DoctorPerformanceResponse> GetDoctorPerformanceAsync(string doctorId, int clinicId, AnalyticsDateRangeQuery query);
    }
}
