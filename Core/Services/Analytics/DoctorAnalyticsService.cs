using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Domain.Contracts;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Domain.Entities.Identity;
using Domain.Exceptions.BadRequest;
using Domain.Exceptions.Forbidden;
using Domain.Exceptions.NotFound;
using Services.Abstractions.Analytics;
using Services.Specifications.Analytics;
using Shared.Dtos.Analytics;

namespace Services.Analytics
{
    public class DoctorAnalyticsService(IUnitOfWork _unitOfWork) : IDoctorAnalyticsService
    {
        public async Task<FinancialOverviewResponse> GetFinancialOverviewAsync(string doctorId, int clinicId, AnalyticsDateRangeQuery query)
        {
            await GetDoctorOwnedClinicAccessAsync(doctorId, clinicId);
            ValidateDateRange(query);

            DateTime? fromUtc = query.FromDate?.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            DateTime? toUtcExclusive = query.ToDate?.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

            var paymentRepository = _unitOfWork.GetRepository<Payment, int>();
            var paymentSpecification = AnalyticsPaymentSpecifications.ForClinic(clinicId, fromUtc, toUtcExclusive);
            var payments = await paymentRepository.GetAllAsync(paymentSpecification);

            // Group original collections by their actual payment method.
            var paymentBreakdowns = payments
                .GroupBy(payment => new
                {
                    MethodType = payment.MethodType?.ToString() ?? "Unknown",
                    Category = payment.MethodType == PaymentMethodType.Paymob ? "Online" : payment.MethodType.HasValue ? "Manual" : "Unknown"
                })
                .Select(group =>
                {
                    var totalCollected = group
                        .Where(payment => (payment.Status == PaymentStatus.Paid || payment.Status == PaymentStatus.Refunded) &&
                                          payment.PaidAt.HasValue &&
                                          (!fromUtc.HasValue || payment.PaidAt.Value >= fromUtc.Value) &&
                                          (!toUtcExclusive.HasValue || payment.PaidAt.Value < toUtcExclusive.Value))
                        .Sum(payment => payment.Amount);

                    var pendingPayments = group
                        .Where(payment => payment.Status == PaymentStatus.PendingVerification &&
                                          (!fromUtc.HasValue || payment.CreatedAt >= fromUtc.Value) &&
                                          (!toUtcExclusive.HasValue || payment.CreatedAt < toUtcExclusive.Value))
                        .Sum(payment => payment.Amount);

                    return new PaymentMethodBreakdownResponse
                    {
                        Category = group.Key.Category,
                        MethodType = group.Key.MethodType,
                        TotalCollected = totalCollected,
                        PendingPayments = pendingPayments,
                        TotalRefunds = 0,
                        NetCollected = totalCollected
                    };
                })
                .ToList();

            // Group successful refunds by the actual refund method, not the original payment method.
            var refundBreakdowns = payments
                .Where(payment => payment.Refund != null &&
                                  payment.Refund.Status == RefundStatus.Succeeded &&
                                  payment.Refund.ProcessedAt.HasValue &&
                                  (!fromUtc.HasValue || payment.Refund.ProcessedAt.Value >= fromUtc.Value) &&
                                  (!toUtcExclusive.HasValue || payment.Refund.ProcessedAt.Value < toUtcExclusive.Value))
                .GroupBy(payment => new
                {
                    MethodType = payment.Refund!.Method?.ToString() ?? "Unknown",
                    Category = payment.Refund!.Method == RefundMethod.Paymob ? "Online" : payment.Refund.Method.HasValue ? "Manual" : "Unknown"
                })
                .Select(group =>
                {
                    var totalRefunds = group.Sum(payment => payment.Refund!.Amount);

                    return new PaymentMethodBreakdownResponse
                    {
                        Category = group.Key.Category,
                        MethodType = group.Key.MethodType,
                        TotalCollected = 0,
                        PendingPayments = 0,
                        TotalRefunds = totalRefunds,
                        NetCollected = -totalRefunds
                    };
                })
                .ToList();

            // Calculate remaining amounts collected in the clinic.
            var remainingAmountCollected = payments
                .Where(payment => payment.Appointment.Status == AppointmentStatus.Completed &&
                                  payment.Appointment.RemainingAmountCollectedAt.HasValue &&
                                  (!fromUtc.HasValue || payment.Appointment.RemainingAmountCollectedAt.Value >= fromUtc.Value) &&
                                  (!toUtcExclusive.HasValue || payment.Appointment.RemainingAmountCollectedAt.Value < toUtcExclusive.Value))
                .Sum(payment => payment.Appointment.RemainingAmount);

            var allBreakdowns = paymentBreakdowns.Concat(refundBreakdowns).ToList();

            if (remainingAmountCollected > 0)
            {
                allBreakdowns.Add(new PaymentMethodBreakdownResponse
                {
                    Category = "Manual",
                    MethodType = "InClinic",
                    TotalCollected = remainingAmountCollected,
                    PendingPayments = 0,
                    TotalRefunds = 0,
                    NetCollected = remainingAmountCollected
                });
            }

            // Merge entries that use the same method and category.
            var paymentMethods = allBreakdowns
                .GroupBy(item => new { item.Category, item.MethodType })
                .Select(group => new PaymentMethodBreakdownResponse
                {
                    Category = group.Key.Category,
                    MethodType = group.Key.MethodType,
                    TotalCollected = group.Sum(item => item.TotalCollected),
                    PendingPayments = group.Sum(item => item.PendingPayments),
                    TotalRefunds = group.Sum(item => item.TotalRefunds),
                    NetCollected = group.Sum(item => item.NetCollected)
                })
                .OrderBy(item => item.Category)
                .ThenBy(item => item.MethodType)
                .ToList();

            return new FinancialOverviewResponse
            {
                TotalCollected = paymentMethods.Sum(method => method.TotalCollected),
                PendingPayments = paymentMethods.Sum(method => method.PendingPayments),
                TotalRefunds = paymentMethods.Sum(method => method.TotalRefunds),
                NetCollected = paymentMethods.Sum(method => method.NetCollected),
                PaymentMethods = paymentMethods
            };
        }

        public async Task<AppointmentOverviewResponse> GetAppointmentOverviewAsync(string doctorId, int clinicId, AnalyticsDateRangeQuery query)
        {
            await GetDoctorOwnedClinicAccessAsync(doctorId, clinicId);
            ValidateDateRange(query);

            var appointmentRepository = _unitOfWork.GetRepository<Appointment, int>();
            var appointmentSpecification = AnalyticsAppointmentSpecifications.ForClinic(clinicId, query.FromDate, query.ToDate);
            var appointments = await appointmentRepository.GetAllAsync(appointmentSpecification);

            return new AppointmentOverviewResponse
            {
                TotalAppointments = appointments.Count(),
                CompletedAppointments = appointments.Count(appointment => appointment.Status == AppointmentStatus.Completed),
                CancelledAppointments = appointments.Count(appointment => appointment.Status == AppointmentStatus.Cancelled),
                NoShowAppointments = appointments.Count(appointment => appointment.Status == AppointmentStatus.NoShow)
            };
        }

        public async Task<DoctorPerformanceResponse> GetDoctorPerformanceAsync(string doctorId, int clinicId, AnalyticsDateRangeQuery query)
        {
            await GetDoctorOwnedClinicAccessAsync(doctorId, clinicId);
            ValidateDateRange(query);

            var doctorRepository = _unitOfWork.GetRepository<Doctor, string>();
            var doctorSpecification = AnalyticsDoctorSpecifications.ForClinic(clinicId);
            var doctors = await doctorRepository.GetAllAsync(doctorSpecification);

            var appointmentRepository = _unitOfWork.GetRepository<Appointment, int>();
            var appointmentSpecification = AnalyticsAppointmentSpecifications.ForClinic(clinicId, query.FromDate, query.ToDate);
            var appointments = await appointmentRepository.GetAllAsync(appointmentSpecification);

            var doctorPerformance = doctors.Select(doctor =>
            {
                var doctorAppointments = appointments
                    .Where(appointment => appointment.AppointmentSlot.DoctorId == doctor.Id)
                    .ToList();

                var collectedAmount = doctorAppointments
                    .Where(appointment => appointment.Payment is not null &&
                                          (appointment.Payment.Status == PaymentStatus.Paid || appointment.Payment.Status == PaymentStatus.Refunded) &&
                                          appointment.Payment.PaidAt.HasValue)
                    .Sum(appointment => appointment.Payment.Amount);

                var totalRefundedAmount = doctorAppointments
                    .Where(appointment => appointment.Payment?.Refund is not null &&
                                          appointment.Payment.Refund.Status == RefundStatus.Succeeded)
                    .Sum(appointment => appointment.Payment!.Refund!.Amount);

                return new DoctorPerformanceItemResponse
                {
                    DoctorId = doctor.Id,
                    DoctorName = $"{doctor.FirstName} {doctor.LastName}".Trim(),
                    CompletedAppointments = doctorAppointments.Count(appointment => appointment.Status == AppointmentStatus.Completed),
                    CollectedAmount = collectedAmount,
                    TotalRefundedAmount = totalRefundedAmount,
                    NetCollectedAmount = collectedAmount - totalRefundedAmount
                };
            })
            .OrderByDescending(doctor => doctor.CollectedAmount)
            .ThenBy(doctor => doctor.DoctorName)
            .ToList();

            return new DoctorPerformanceResponse
            {
                Doctors = doctorPerformance
            };
        }

        private static void ValidateDateRange(AnalyticsDateRangeQuery query)
        {
            if (query.FromDate.HasValue && query.ToDate.HasValue && query.FromDate.Value > query.ToDate.Value)
                throw new BadRequestException("FromDate cannot be later than ToDate.");
        }

        private async Task GetDoctorOwnedClinicAccessAsync(string doctorId, int clinicId)
        {
            if (string.IsNullOrWhiteSpace(doctorId))
                throw new BadRequestException("We couldn't identify your account.");

            var doctor = await _unitOfWork.GetRepository<Doctor, string>().GetByIdAsync(doctorId);
            if (doctor is null)
                throw new NotFoundException("We couldn't find your account.");

            var clinic = await _unitOfWork.GetRepository<Clinic, int>().GetByIdAsync(clinicId);
            if (clinic is null)
                throw new NotFoundException("The clinic you are trying to access does not exist.");

            var doctorClinic = await _unitOfWork.GetRepository<DoctorClinic>().GetByCompositeKeyAsync(doctor.Id, clinic.Id);
            if (doctorClinic is null)
                throw new ResourceAccessDeniedException("You don't have access to this clinic.");

            if (!doctorClinic.IsOwner)
                throw new ResourceAccessDeniedException("Only the clinic owner can access analytics.");
        }

    }
}
