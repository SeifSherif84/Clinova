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

            var paymentRepository = _unitOfWork.GetRepository<DepositPayment, int>();
            var paymentSpecification = AnalyticsPaymentSpecifications.ForClinic(clinicId, fromUtc, toUtcExclusive);
            var payments = await paymentRepository.GetAllAsync(paymentSpecification);

            // --------------------------------------------------
            // 1. Deposit payment breakdown
            // --------------------------------------------------

            var depositBreakdowns = payments
                .GroupBy(payment => new
                {
                    MethodType = payment.MethodType?.ToString() ?? "Unknown",
                    Category = payment.MethodType == DepositPaymentMethodType.Paymob ? "Online" : payment.MethodType.HasValue ? "Manual" : "Unknown"
                })
                .Select(group =>
                {
                    var totalCollected = group
                        .Where(payment => (payment.Status == DepositPaymentStatus.Paid || payment.Status == DepositPaymentStatus.Refunded) &&
                                          (payment.PaidAt.HasValue) &&
                                          (!fromUtc.HasValue || payment.PaidAt.Value >= fromUtc.Value) &&
                                          (!toUtcExclusive.HasValue || payment.PaidAt.Value < toUtcExclusive.Value))
                        .Sum(payment => payment.RequiredAmount);

                    var awaitingVerification = group
                        .Where(payment => (payment.Status == DepositPaymentStatus.PendingVerification) &&
                                          (!fromUtc.HasValue || payment.CreatedAt >= fromUtc.Value) &&
                                          (!toUtcExclusive.HasValue || payment.CreatedAt < toUtcExclusive.Value))
                        .Sum(payment => payment.RequiredAmount);

                    return new PaymentMethodBreakdownResponse
                    {
                        MethodType = group.Key.MethodType,
                        Category = group.Key.Category,
                        TotalCollected = totalCollected,
                        AwaitingVerificationPayments = awaitingVerification,
                        TotalRefunds = 0,
                        NetCollected = totalCollected
                    };
                })
                .ToList();


            // --------------------------------------------------
            // 2. Remaining payment breakdown
            // --------------------------------------------------

            var remainingBreakdowns = payments
                .Where(payment => payment.Appointment.RemainingPayment != null)
                .Select(payment => payment.Appointment.RemainingPayment!)
                .Where(remainingPayment => (remainingPayment.Status == RemainingPaymentStatus.Paid) &&
                                           (remainingPayment.PaidAt.HasValue) &&
                                           (!fromUtc.HasValue || remainingPayment.PaidAt.Value >= fromUtc.Value) &&
                                           (!toUtcExclusive.HasValue || remainingPayment.PaidAt.Value < toUtcExclusive.Value))
                .GroupBy(remainingPayment => new
                {
                    MethodType = remainingPayment.MethodType?.ToString() ?? "Unknown",
                    Category = remainingPayment.MethodType.HasValue ? "Manual" : "Unknown"
                })
                .Select(group =>
                {
                    var totalCollected = group
                        .Where(remainingPayment => (remainingPayment.Status == RemainingPaymentStatus.Paid) &&
                                                   (remainingPayment.PaidAt.HasValue) &&
                                                   (!fromUtc.HasValue || remainingPayment.PaidAt.Value >= fromUtc.Value) &&
                                                   (!toUtcExclusive.HasValue || remainingPayment.PaidAt.Value < toUtcExclusive.Value))
                        .Sum(remainingPayment => remainingPayment.RequiredAmount);

                    return new PaymentMethodBreakdownResponse
                    {
                        MethodType = group.Key.MethodType,
                        Category = group.Key.Category,
                        TotalCollected = totalCollected,
                        AwaitingVerificationPayments = 0,
                        TotalRefunds = 0,
                        NetCollected = totalCollected
                    };
                })
                .ToList();


            // --------------------------------------------------
            // 3. Successful deposit refund breakdown
            // --------------------------------------------------

            var refundBreakdowns = payments
                .Where(payment => (payment.DepositRefund != null) &&
                                  (payment.DepositRefund.Status == DepositRefundStatus.Succeeded) &&
                                  (payment.DepositRefund.ProcessedAt.HasValue) &&
                                  (!fromUtc.HasValue || payment.DepositRefund.ProcessedAt.Value >= fromUtc.Value) &&
                                  (!toUtcExclusive.HasValue || payment.DepositRefund.ProcessedAt.Value < toUtcExclusive.Value))
                .GroupBy(payment => new
                {
                    MethodType = payment.DepositRefund!.MethodType?.ToString() ?? "Unknown",
                    Category = payment.DepositRefund.MethodType == DepositRefundMethodType.Paymob ? "Online" : payment.DepositRefund.MethodType.HasValue ? "Manual" : "Unknown"
                })
                .Select(group =>
                {
                    var totalRefunds = group
                        .Sum(payment => payment.DepositRefund!.RequestedRefundAmount);

                    return new PaymentMethodBreakdownResponse
                    {
                        MethodType = group.Key.MethodType,
                        Category = group.Key.Category,
                        TotalCollected = 0,
                        AwaitingVerificationPayments = 0,
                        TotalRefunds = totalRefunds,
                        NetCollected = -totalRefunds
                    };
                })
                .ToList();


            // --------------------------------------------------
            // 4. Combine all financial breakdowns
            // --------------------------------------------------

            var allBreakdowns = depositBreakdowns
                .Concat(remainingBreakdowns)
                .Concat(refundBreakdowns)
                .ToList();


            // --------------------------------------------------
            // 5. Merge entries by actual payment method and category
            // --------------------------------------------------

            var paymentMethods = allBreakdowns
                .GroupBy(item => new
                {
                    item.Category,
                    item.MethodType
                })
                .Select(group => new PaymentMethodBreakdownResponse
                {
                    Category = group.Key.Category,
                    MethodType = group.Key.MethodType,
                    TotalCollected = group.Sum(item => item.TotalCollected),
                    AwaitingVerificationPayments = group.Sum(item => item.AwaitingVerificationPayments),
                    TotalRefunds = group.Sum(item => item.TotalRefunds),
                    NetCollected = group.Sum(item => item.NetCollected)
                })
                .OrderBy(item => item.Category)
                .ThenBy(item => item.MethodType)
                .ToList();

            // --------------------------------------------------
            // 6. Financial overview totals
            // --------------------------------------------------

            return new FinancialOverviewResponse
            {
                TotalCollected = paymentMethods.Sum(item => item.TotalCollected),
                AwaitingVerificationPayments = paymentMethods.Sum(item => item.AwaitingVerificationPayments),
                TotalRefunds = paymentMethods.Sum(item => item.TotalRefunds),
                NetCollected = paymentMethods.Sum(item => item.NetCollected),
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
                ConfirmedAppointments = appointments.Count(appointment => appointment.Status == AppointmentStatus.Confirmed),
                CompletedAppointments = appointments.Count(appointment => appointment.Status == AppointmentStatus.Completed),
                CancelledAppointments = appointments.Count(appointment => appointment.Status == AppointmentStatus.Cancelled),
                NoShowAppointments = appointments.Count(appointment => appointment.Status == AppointmentStatus.NoShow),
                PendingVerificationAppointments = appointments.Count(appointment => appointment.Status == AppointmentStatus.PendingVerification)
            };
        }



        public async Task<DoctorPerformanceResponse> GetDoctorPerformanceAsync(string doctorId, int clinicId, AnalyticsDateRangeQuery query)
        {
            await GetDoctorOwnedClinicAccessAsync(doctorId, clinicId);
            ValidateDateRange(query);

            DateTime? fromUtc = query.FromDate?.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            DateTime? toUtcExclusive = query.ToDate?.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

            var doctorRepository = _unitOfWork.GetRepository<Doctor, string>();
            var doctorSpecification = AnalyticsDoctorSpecifications.ForClinic(clinicId);
            var doctors = await doctorRepository.GetAllAsync(doctorSpecification);

            var appointmentRepository = _unitOfWork.GetRepository<Appointment, int>();

            // Get appointments with actual collections during the selected period.
            var financialSpecification = AnalyticsAppointmentSpecifications.ForClinicFinancialMovements(clinicId, fromUtc, toUtcExclusive);
            var financialAppointments = await appointmentRepository.GetAllAsync(financialSpecification);

            // Get appointments scheduled within the selected date range.
            var appointmentCountSpecification = AnalyticsAppointmentSpecifications.ForClinic(clinicId, query.FromDate, query.ToDate);
            var appointmentsInDateRange = await appointmentRepository.GetAllAsync(appointmentCountSpecification);

            var doctorPerformance = doctors.Select(doctor =>
            {
                var doctorFinancialAppointments = financialAppointments
                    .Where(appointment => (appointment.AppointmentSlot.DoctorId == doctor.Id))
                    .ToList();

                var doctorAppointmentsInDateRange = appointmentsInDateRange
                    .Where(appointment => (appointment.AppointmentSlot.DoctorId == doctor.Id))
                    .ToList();

                // 1. Deposits actually collected and not marked as refunded.
                var collectedDepositAmount = doctorFinancialAppointments
                    .Where(appointment => (appointment.DepositPayment is not null) &&
                                          (appointment.DepositPayment.Status == DepositPaymentStatus.Paid) &&
                                          (appointment.DepositPayment.PaidAt.HasValue) &&
                                          (!fromUtc.HasValue || appointment.DepositPayment.PaidAt.Value >= fromUtc.Value) &&
                                          (!toUtcExclusive.HasValue || appointment.DepositPayment.PaidAt.Value < toUtcExclusive.Value))
                    .Sum(appointment => appointment.DepositPayment!.RequiredAmount);

                // 2. Remaining payments actually collected during the selected period.
                var collectedRemainingAmount = doctorFinancialAppointments
                    .Where(appointment => (appointment.RemainingPayment is not null) &&
                                          (appointment.RemainingPayment.Status == RemainingPaymentStatus.Paid) &&
                                          (appointment.RemainingPayment.PaidAt.HasValue) &&
                                          (!fromUtc.HasValue || appointment.RemainingPayment.PaidAt.Value >= fromUtc.Value) &&
                                          (!toUtcExclusive.HasValue || appointment.RemainingPayment.PaidAt.Value < toUtcExclusive.Value))
                    .Sum(appointment => appointment.RemainingPayment!.RequiredAmount);

                var collectedAmount = collectedDepositAmount + collectedRemainingAmount;

                // 3. Expected remaining payments from eligible appointments.
                // Include only Confirmed or Completed appointments whose remaining payment is still Pending.
                var expectedAmount = doctorAppointmentsInDateRange
                    .Where(appointment => (appointment.Status == AppointmentStatus.Confirmed || appointment.Status == AppointmentStatus.Completed) &&
                                          (appointment.RemainingPayment is not null) &&
                                          (appointment.RemainingPayment.Status == RemainingPaymentStatus.Pending))
                    .Sum(appointment => appointment.RemainingPayment!.RequiredAmount);

                return new DoctorPerformanceItemResponse
                {
                    DoctorId = doctor.Id,
                    DoctorName = $"{doctor.FirstName} {doctor.LastName}".Trim(),
                    ConfirmedAppointments = doctorAppointmentsInDateRange.Count(appointment => (appointment.Status == AppointmentStatus.Confirmed)),
                    CompletedAppointments = doctorAppointmentsInDateRange.Count(appointment => (appointment.Status == AppointmentStatus.Completed)),
                    CollectedAmount = collectedAmount,
                    ExpectedAmount = expectedAmount
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
