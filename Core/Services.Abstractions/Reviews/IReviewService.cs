using Domain.Entities.BusinessEntities;
using Shared.Dtos.Appointments;
using Shared.Dtos.Reviews;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.Reviews
{
    public interface IReviewService
    {
        Task<string> PatientSubmitReviewAsync(string userId, int appointmentId, CreateReviewRequest request);
        Task<string> PatientUpdateReviewAsync(string userId, int reviewId, int appointmentId, UpdateReviewRequest request);
        Task<string> PatientDeleteReviewAsync(string userId, int reviewId, int appointmentId);
        Task<IEnumerable<PatientGetHisOwnReviewResponse>> PatientGetHisOwnReviewsAsync(string userId);
        Task<PaginatedReviewsResult<PatientGetDoctorReviewResponse>> PatientGetDoctorReviewsAsync(string userId, string doctorId, int pageIndex, int pageSize);
        Task<PatientGetDoctorRatingSummaryResponse> PatientGetDoctorRatingSummaryAsync(string userId, string doctorId);
        Task<PaginatedReviewsResult<DoctorGetHisOwnReviewResponse>> DoctorGetHisOwnReviewsAsync(string userId, int pageIndex, int pageSize);
    }
}
