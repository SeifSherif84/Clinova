using Domain.Contracts;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Domain.Exceptions.BadRequest;
using Domain.Exceptions.InternalServerError;
using Domain.Exceptions.NotFound;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Services.Abstractions.Reviews;
using Services.Specifications.Reviews;
using Shared.Dtos.Appointments;
using Shared.Dtos.Reviews;
using Stripe;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Reviews
{
    public class ReviewService(IUnitOfWork _unitOfWork) : IReviewService
    {
        public async Task<string> PatientSubmitReviewAsync(string userId, int appointmentId, CreateReviewRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var patient = await _unitOfWork.GetRepository<Patient, string>().GetByIdAsync(userId);
            if (patient is null)
                throw new NotFoundException("We couldn't find your account.");

            var appointment = await _unitOfWork.GetRepository<Appointment, int>().GetByIdAsync(appointmentId);
            if (appointment is null)
                throw new NotFoundException("We couldn't find the appointment.");

            if (appointment.PatientId != userId)
                throw new BadRequestException("You are not authorized to review this appointment.");

            if (appointment.Status != AppointmentStatus.Completed)
                throw new BadRequestException("You can only review completed appointments.");

            var reviewRepo = _unitOfWork.GetRepository<Domain.Entities.BusinessEntities.Review, int>();
            var reviewSpecification = ReviewSpecifications.CheckIfReviewExistForThisAppointment(appointmentId);
            var existingReview = await reviewRepo.GetByIdAsync(reviewSpecification);
            if (existingReview is not null)
                throw new BadRequestException("You have already submitted a review for this appointment.");

            var review = new Domain.Entities.BusinessEntities.Review()
            {
                Rating = request.Rating,
                Comment = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment.Trim(),
                IsAnonymous = request.IsAnonymous,
                Status = string.IsNullOrWhiteSpace(request.Comment) ? ReviewStatus.Approved : ReviewStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                AppointmentId = appointmentId
            };

            await reviewRepo.AddAsync(review);

            try
            {
                var result = await _unitOfWork.SaveChangesAsync();
                if (result == 0)
                    throw new InternalServerErrorException("We couldn't submit your review right now. Please try again later.");
            }
            catch (DbUpdateException ex)
            when (ex.InnerException is SqlException sqlException && (sqlException.Number == 2601 || sqlException.Number == 2627))
            {
                throw new BadRequestException("You have already submitted a review for this appointment.");
            }

            return string.IsNullOrWhiteSpace(review.Comment) ? "Your rating has been submitted successfully."
                                                             : "Your review has been submitted successfully and is pending admin approval.";
        }


        public async Task<string> PatientUpdateReviewAsync(string userId, int reviewId, int appointmentId, UpdateReviewRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var patient = await _unitOfWork.GetRepository<Patient, string>().GetByIdAsync(userId);
            if (patient is null)
                throw new NotFoundException("We couldn't find your account.");

            var review = await _unitOfWork.GetRepository<Domain.Entities.BusinessEntities.Review, int>().GetByIdAsync(reviewId);
            if (review is null)
                throw new NotFoundException("We couldn't find the review.");

            var appointment = await _unitOfWork.GetRepository<Appointment, int>().GetByIdAsync(review.AppointmentId);
            if (appointment is null)
                throw new NotFoundException("We couldn't find the appointment related to this review.");

            if (appointment.PatientId != userId)
                throw new BadRequestException("You are not authorized to update this review.");

            if(appointment.Status != AppointmentStatus.Completed)
                throw new BadRequestException("You can only update reviews for completed appointments.");

            if (review.AppointmentId != appointmentId)
                throw new BadRequestException("The review does not belong to the specified appointment.");

            bool isCommentUpdated = !string.IsNullOrWhiteSpace(request.Comment);

            if (request.Rating.HasValue)
                review.Rating = request.Rating.Value;

            if (isCommentUpdated)
                review.Comment = request.Comment!.Trim();

            if (request.IsAnonymous.HasValue)
                review.IsAnonymous = request.IsAnonymous.Value;

            if (!request.Rating.HasValue && !isCommentUpdated && !request.IsAnonymous.HasValue)
                throw new BadRequestException("Please provide at least one field to update.");

            if (isCommentUpdated)
                review.Status = ReviewStatus.Pending;

            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException("We couldn't update your review right now. Please try again later.");

            return review.Status == ReviewStatus.Approved ? "Your review has been updated successfully."
                                                          : "Your review has been updated successfully and is pending admin approval.";
        }


        public async Task<string> PatientDeleteReviewAsync(string userId, int reviewId, int appointmentId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var patient = await _unitOfWork.GetRepository<Patient, string>().GetByIdAsync(userId);
            if (patient is null)
                throw new NotFoundException("We couldn't find your account.");

            var reviewRepo = _unitOfWork.GetRepository<Domain.Entities.BusinessEntities.Review, int>();
            var review = await reviewRepo.GetByIdAsync(reviewId);
            if (review is null)
                throw new NotFoundException("We couldn't find the review.");

            var appointment = await _unitOfWork.GetRepository<Appointment, int>().GetByIdAsync(review.AppointmentId);
            if (appointment is null)
                throw new NotFoundException("We couldn't find the appointment related to this review.");

            if (appointment.PatientId != userId)
                throw new BadRequestException("You are not authorized to delete this review.");

            if (appointment.Status != AppointmentStatus.Completed)
                throw new BadRequestException("You can only delete reviews for completed appointments.");

            if (review.AppointmentId != appointmentId)
                throw new BadRequestException("The review does not belong to the specified appointment.");

            reviewRepo.Delete(review);

            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException("We couldn't delete your review right now. Please try again later.");

            return "Your review has been deleted successfully.";
        }


        public async Task<IEnumerable<PatientGetHisOwnReviewResponse>> PatientGetHisOwnReviewsAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var patient = await _unitOfWork.GetRepository<Patient, string>().GetByIdAsync(userId);
            if (patient is null)
                throw new NotFoundException("We couldn't find your account.");

            var reviewRepo = _unitOfWork.GetRepository<Domain.Entities.BusinessEntities.Review, int>();
            var reviewSpecification = ReviewSpecifications.PatientGetHisOwnReviews(userId);
            var reviews = await reviewRepo.GetAllAsync(reviewSpecification);

            var reviewResponses = reviews.Select(review => new PatientGetHisOwnReviewResponse()
            {
                ReviewId = review.Id,
                AppointmentId = review.AppointmentId,
                Rating = review.Rating,
                Comment = review.Comment,
                IsAnonymous = review.IsAnonymous,
                Status = review.Status.ToString(),
                CreatedAt = review.CreatedAt,
                DoctorId = review.Appointment.AppointmentSlot.DoctorId,
                DoctorName = $"{review.Appointment.AppointmentSlot.Doctor.FirstName} {review.Appointment.AppointmentSlot.Doctor.LastName}",
                ClinicName = review.Appointment.AppointmentSlot.Clinic.Name
            }).ToList();

            return reviewResponses;
        }


        public async Task<PaginatedReviewsResult<PatientGetDoctorReviewResponse>> PatientGetDoctorReviewsAsync(string userId, string doctorId, int pageIndex, int pageSize)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var patient = await _unitOfWork.GetRepository<Patient, string>().GetByIdAsync(userId);
            if (patient is null)
                throw new NotFoundException("We couldn't find your account.");

            var doctorRepo = _unitOfWork.GetRepository<Doctor, string>();
            var doctor = await doctorRepo.GetByIdAsync(doctorId);
            if (doctor is null)
                throw new NotFoundException("We couldn't find the doctor.");

            if (pageIndex < 1)
                throw new BadRequestException("Page index must be greater than zero.");

            if (pageSize < 1)
                throw new BadRequestException("Page size must be greater than zero.");

            var reviewRepo = _unitOfWork .GetRepository<Domain.Entities.BusinessEntities.Review, int>();

            var countSpecification = ReviewSpecifications.PatientGetDoctorReviews(doctorId, pageIndex, pageSize, false);
            var totalReviews = await reviewRepo.CountAsync(countSpecification);
            if (totalReviews == 0)
            {
                return new PaginatedReviewsResult<PatientGetDoctorReviewResponse>
                {
                    PageIndex = pageIndex,
                    PageSize = pageSize,
                    TotalCount = 0,
                    AverageRating = 0,
                    Items = new List<PatientGetDoctorReviewResponse>()
                };
            }
            var averageRating = await reviewRepo.AverageAsync(countSpecification, review => review.Rating);

            var paginatedSpecification = ReviewSpecifications.PatientGetDoctorReviews(doctorId, pageIndex, pageSize, true);
            var reviews = await reviewRepo.GetAllAsync(paginatedSpecification);
            var reviewResponses = reviews.Select(review => new PatientGetDoctorReviewResponse
            {
                ReviewId = review.Id,
                Rating = review.Rating,
                Comment = review.Comment,
                IsAnonymous = review.IsAnonymous,
                PatientName = review.IsAnonymous ? "Anonymous" : $"{review.Appointment.Patient!.FirstName} {review.Appointment.Patient.LastName}",
                CreatedAt = review.CreatedAt
            }).ToList();

            return new PaginatedReviewsResult<PatientGetDoctorReviewResponse>
            {
                PageIndex = pageIndex,
                PageSize = pageSize,
                TotalCount = totalReviews,
                AverageRating = averageRating,
                Items = reviewResponses
            };
        }


        public async Task<PatientGetDoctorRatingSummaryResponse> PatientGetDoctorRatingSummaryAsync(string userId, string doctorId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var patient = await _unitOfWork.GetRepository<Patient, string>().GetByIdAsync(userId);
            if (patient is null)
                throw new NotFoundException("We couldn't find your account.");

            var doctorRepo = _unitOfWork.GetRepository<Doctor, string>();
            var doctor = await doctorRepo.GetByIdAsync(doctorId);
            if (doctor is null)
                throw new NotFoundException("We couldn't find the doctor.");

            var reviewRepo = _unitOfWork.GetRepository<Domain.Entities.BusinessEntities.Review, int>();
            var allReviewsSpecification = ReviewSpecifications.PatientGetDoctorRatingSummary(doctorId, null);
            var totalReviews = await reviewRepo.CountAsync(allReviewsSpecification);

            if (totalReviews == 0)
            {
                return new PatientGetDoctorRatingSummaryResponse
                {
                    DoctorId = doctorId,
                    AverageRating = 0,
                    TotalReviews = 0,
                    RatingBreakdown = new RatingBreakdownResponse()
                };
            }

            var averageRating = await reviewRepo.AverageAsync(allReviewsSpecification, review => review.Rating);

            return new PatientGetDoctorRatingSummaryResponse
            {
                DoctorId = doctorId,
                TotalReviews = totalReviews,
                AverageRating = averageRating,
                RatingBreakdown = new RatingBreakdownResponse
                {
                    FiveStars = await reviewRepo.CountAsync(ReviewSpecifications.PatientGetDoctorRatingSummary(doctorId, 5)),
                    FourStars = await reviewRepo.CountAsync(ReviewSpecifications.PatientGetDoctorRatingSummary(doctorId, 4)),
                    ThreeStars = await reviewRepo.CountAsync(ReviewSpecifications.PatientGetDoctorRatingSummary(doctorId, 3)),
                    TwoStars = await reviewRepo.CountAsync(ReviewSpecifications.PatientGetDoctorRatingSummary(doctorId, 2)),
                    OneStar = await reviewRepo.CountAsync(ReviewSpecifications.PatientGetDoctorRatingSummary(doctorId, 1))
                }
            };
        }


        public async Task<PaginatedReviewsResult<DoctorGetHisOwnReviewResponse>> DoctorGetHisOwnReviewsAsync(string doctorId, int pageIndex, int pageSize)
        {
            if (string.IsNullOrWhiteSpace(doctorId))
                throw new BadRequestException("We couldn't identify your account.");

            var doctor = await _unitOfWork.GetRepository<Doctor, string>().GetByIdAsync(doctorId);
            if (doctor is null)
                throw new NotFoundException("We couldn't find your account.");

            if (pageIndex < 1)
                throw new BadRequestException("Page index must be greater than zero.");

            if (pageSize < 1)
                throw new BadRequestException("Page size must be greater than zero.");

            var reviewRepo = _unitOfWork.GetRepository<Domain.Entities.BusinessEntities.Review, int>();
            var countSpecification = ReviewSpecifications.DoctorGetHisReviews(doctorId, pageIndex, pageSize, false);
            var totalReviews = await reviewRepo.CountAsync(countSpecification);

            if (totalReviews == 0)
            {
                return new PaginatedReviewsResult<DoctorGetHisOwnReviewResponse>
                {
                    PageIndex = pageIndex,
                    PageSize = pageSize,
                    TotalCount = 0,
                    AverageRating = 0,
                    Items = new List<DoctorGetHisOwnReviewResponse>()
                };
            }

            var averageRating = await reviewRepo.AverageAsync(countSpecification, review => review.Rating);

            var paginatedSpecification = ReviewSpecifications.DoctorGetHisReviews(doctorId, pageIndex, pageSize, true);
            var reviews = await reviewRepo.GetAllAsync(paginatedSpecification);

            var reviewResponses = reviews.Select(review => new DoctorGetHisOwnReviewResponse
            {
                ReviewId = review.Id,
                AppointmentId = review.AppointmentId,
                Rating = review.Rating,
                Comment = review.Comment,
                IsAnonymous = review.IsAnonymous,
                PatientName = review.IsAnonymous ? "Anonymous" : $"{review.Appointment.Patient!.FirstName} {review.Appointment.Patient.LastName}",
                CreatedAt = review.CreatedAt
            }).ToList();

            return new PaginatedReviewsResult<DoctorGetHisOwnReviewResponse>
            {
                PageIndex = pageIndex,
                PageSize = pageSize,
                TotalCount = totalReviews,
                AverageRating = averageRating,
                Items = reviewResponses
            };
        }

    }
}
