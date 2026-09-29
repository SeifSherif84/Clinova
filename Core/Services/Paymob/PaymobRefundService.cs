using Domain.Contracts;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Domain.Exceptions.BadRequest;
using Domain.Exceptions.InternalServerError;
using Domain.Exceptions.NotFound;
using Microsoft.EntityFrameworkCore;
using Services.Abstractions.DataProtection;
using Services.Abstractions.Paymob;
using Services.Specifications.ClinicOnlinePaymentAccounts;
using Services.Specifications.PaymentRefunds;
using Services.Specifications.Payments;
using Shared.Dtos.Paymob;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Paymob
{
    public class PaymobRefundService(IUnitOfWork _unitOfWork,
                                     IPaymobService _paymobService,
                                     IPaymentCredentialEncryptor _credentialProtector) : IPaymobRefundService
    {
        public async Task<RefundResult> RefundPaymentAsync(int paymentId, RefundReason reason)
        {
            var paymentRepo = _unitOfWork.GetRepository<Payment, int>();
            var paymentSpec = PaymentSpecifications.ForRefund(paymentId);
            var payment = await paymentRepo.GetByIdAsync(paymentSpec);

            if (payment is null)
                throw new NotFoundException("The payment was not found.");


            // ---------------------------------------------------------
            // Already refunded
            // ---------------------------------------------------------

            if (payment.Status == PaymentStatus.Refunded)
            {
                if (payment.Refund is null)
                    throw new InternalServerErrorException("The payment is marked as refunded, but its refund record could not be found.");


                return new RefundResult
                {
                    Succeeded = true,
                    PendingVerification = false,
                    ProviderRefundTransactionId = payment.Refund.ProviderRefundTransactionId,
                    ProviderResponse = payment.Refund.ProviderResponse
                };
            }


            // ---------------------------------------------------------
            // Payment must be successful before refunding.
            // ---------------------------------------------------------

            if (payment.Status != PaymentStatus.Paid)
                throw new BadRequestException("Only successful payments can be refunded.");


            // ---------------------------------------------------------
            // Transaction ID validation
            // ---------------------------------------------------------

            if (string.IsNullOrWhiteSpace(payment.ProviderTransactionId))
                throw new BadRequestException("The payment does not have a valid Paymob transaction ID.");


            if (!long.TryParse(payment.ProviderTransactionId, out var transactionId) || transactionId <= 0)
                throw new BadRequestException( "The payment does not have a valid Paymob transaction ID.");


            // ---------------------------------------------------------
            // Refund amount
            // ---------------------------------------------------------

            var refundAmount = payment.Amount;
            if (refundAmount <= 0)
                throw new BadRequestException("The refund amount must be greater than zero.");


            var amountCents = checked((long)Math.Round(refundAmount * 100m, 0, MidpointRounding.AwayFromZero));
            if (amountCents <= 0)
                throw new BadRequestException("The refund amount is invalid.");


            // ---------------------------------------------------------
            // Appointment validation
            // ---------------------------------------------------------

            var appointment = payment.Appointment;
            if (appointment is null)
                throw new BadRequestException("The payment is not associated with an appointment.");


            if (appointment.AppointmentSlot is null)
                throw new BadRequestException("The appointment slot associated with this payment could not be found.");


            var clinicId = appointment.AppointmentSlot.ClinicId;

            // ---------------------------------------------------------
            // Clinic Paymob account
            // ---------------------------------------------------------

            var accountRepo = _unitOfWork.GetRepository<ClinicOnlinePaymentAccount,int>();
            var accountSpec = ClinicOnlinePaymentAccountSpecifications.ByClinic(clinicId);

            var account = await accountRepo.GetByIdAsync(accountSpec);
            if (account is null)
                throw new BadRequestException("The clinic's online payment account was not found.");


            if (account.Provider != OnlinePaymentProvider.Paymob)
                throw new BadRequestException("The clinic is not configured to use Paymob.");



            // ---------------------------------------------------------
            // Decrypt Paymob credentials
            // ---------------------------------------------------------

            var secretKey = _credentialProtector.Decrypt(account.SecretKey);

            if (string.IsNullOrWhiteSpace(secretKey))
                throw new BadRequestException("The clinic's Paymob secret key is not available.");



            var apiKey = _credentialProtector.Decrypt(account.ApiKey);

            if (string.IsNullOrWhiteSpace(apiKey))
                throw new BadRequestException("The clinic's Paymob API key is not available.");


            // =========================================================
            // Existing refund
            // =========================================================

            if (payment.Refund is not null)
            {
                var existingRefund = payment.Refund;


                // -----------------------------------------------------
                // Already succeeded
                // -----------------------------------------------------

                if (existingRefund.Status == RefundStatus.Succeeded)
                {
                    return new RefundResult
                    {
                        Succeeded = true,
                        PendingVerification = false,
                        ProviderRefundTransactionId = existingRefund.ProviderRefundTransactionId,
                        ProviderResponse = existingRefund.ProviderResponse
                    };
                }


                // -----------------------------------------------------
                // Processing / PendingVerification
                //
                // NEVER send another refund request immediately.
                //
                // First verify Paymob's actual state.
                // -----------------------------------------------------

                if (existingRefund.Status is RefundStatus.Processing or RefundStatus.PendingVerification)
                {
                    var verificationResult = await VerifyExistingRefundAsync(payment,
                                                                             existingRefund,
                                                                             transactionId,
                                                                             amountCents,
                                                                             apiKey,
                                                                             secretKey);

                    if (verificationResult is not null)
                        return verificationResult;
                }


                // -----------------------------------------------------
                // Failed
                //
                // Previous request was definitely rejected by Paymob.
                // A fresh refund attempt is allowed.
                // -----------------------------------------------------

                if (existingRefund.Status == RefundStatus.Failed)
                {
                    existingRefund.Status = RefundStatus.Processing;
                    existingRefund.Reason = reason;
                    existingRefund.Amount = refundAmount;
                    existingRefund.OriginalTransactionId = payment.ProviderTransactionId;
                    existingRefund.RequestedAt = DateTime.UtcNow;
                    existingRefund.ProcessedAt = null;
                    existingRefund.FailureReason = null;
                    existingRefund.ProviderRefundTransactionId = null;
                    existingRefund.ProviderResponse = null;
                }
            }


            // =========================================================
            // Create refund record
            // =========================================================

            PaymentRefund refund;

            if (payment.Refund is null)
            {
                refund = new PaymentRefund
                {
                    PaymentId = payment.Id,
                    IdempotencyKey = $"refund-payment-{payment.Id}",
                    Reason = reason,
                    Status = RefundStatus.Processing,
                    Amount = refundAmount,
                    OriginalTransactionId = payment.ProviderTransactionId,
                    RequestedAt = DateTime.UtcNow
                };
                await _unitOfWork.GetRepository<PaymentRefund, int>().AddAsync(refund);
            }
            else
                refund = payment.Refund;


            // ---------------------------------------------------------
            // Save Processing before calling Paymob
            // ---------------------------------------------------------

            try
            {
                await _unitOfWork.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                var latestPayment =await paymentRepo.GetByIdAsync(paymentSpec);

                if (latestPayment?.Refund is null)
                    throw new InternalServerErrorException("The refund state could not be verified.");

                return BuildResultFromExistingRefund(latestPayment.Refund);
            }
            catch (DbUpdateException)
            {
                var existingPayment = await paymentRepo.GetByIdAsync(paymentSpec);

                if (existingPayment?.Refund is null)
                    throw;

                return BuildResultFromExistingRefund(existingPayment.Refund);
            }


            // =========================================================
            // Call Paymob refund
            // =========================================================

            RefundResult providerResult;

            try
            {
                providerResult = await _paymobService.RefundAsync(secretKey, transactionId, amountCents);
            }
            catch (HttpRequestException)
            {
                /*
                 * The request may have reached Paymob.
                 *
                 * Therefore we MUST NOT mark the refund as Failed.
                 */

                refund.Status = RefundStatus.PendingVerification;

                refund.FailureReason = "The refund request could not be confirmed.";

                try
                {
                    await _unitOfWork.SaveChangesAsync();
                }
                catch
                {
                    // The refund remains unresolved.
                }

                return new RefundResult
                {
                    Succeeded = false,
                    PendingVerification = true,
                    ErrorMessage = "The refund request could not be confirmed."
                };
            }
            catch (TaskCanceledException)
            {
                refund.Status = RefundStatus.PendingVerification;

                refund.FailureReason = "The refund request timed out before its result could be confirmed.";

                try
                {
                    await _unitOfWork.SaveChangesAsync();
                }
                catch
                {
                    // The refund remains unresolved.
                }

                return new RefundResult
                {
                    Succeeded = false,
                    PendingVerification = true,
                    ErrorMessage = "The refund request timed out before its result could be confirmed."
                };
            }


            // =========================================================
            // Provider confirmed refund
            // =========================================================

            if (providerResult.Succeeded)
            {
                refund.Status = RefundStatus.Succeeded;
                refund.ProviderRefundTransactionId = providerResult.ProviderRefundTransactionId;
                refund.ProcessedAt = DateTime.UtcNow;
                refund.ProviderResponse = providerResult.ProviderResponse;
                payment.Status = PaymentStatus.Refunded;
                await _unitOfWork.SaveChangesAsync();
                return providerResult;
            }


            // =========================================================
            // Provider result is uncertain
            // =========================================================

            if (providerResult.PendingVerification)
            {
                refund.Status = RefundStatus.PendingVerification;
                refund.FailureReason = providerResult.ErrorMessage;
                refund.ProviderRefundTransactionId = providerResult.ProviderRefundTransactionId;
                refund.ProviderResponse = providerResult.ProviderResponse;
                await _unitOfWork.SaveChangesAsync();
                return providerResult;
            }


            // =========================================================
            // Paymob definitely rejected the refund
            // =========================================================

            refund.Status = RefundStatus.Failed;
            refund.FailureReason = providerResult.ErrorMessage;
            refund.ProviderRefundTransactionId = providerResult.ProviderRefundTransactionId;
            refund.ProviderResponse = providerResult.ProviderResponse;
            await _unitOfWork.SaveChangesAsync();
            return providerResult;
        }


        // =============================================================
        // Verify an existing Processing / PendingVerification refund
        // =============================================================

        private async Task<RefundResult?> VerifyExistingRefundAsync(
            Payment payment,
            PaymentRefund refund,
            long transactionId,
            long expectedAmountCents,
            string apiKey,
            string secretKey)
        {
            var inquiryResult =
                await _paymobService.GetTransactionAsync(
                    apiKey,
                    transactionId);

            // Paymob inquiry itself could not be completed.
            // We still don't know whether the refund happened.
            if (!inquiryResult.Succeeded)
            {
                return new RefundResult
                {
                    Succeeded = false,
                    PendingVerification = true,
                    ProviderRefundTransactionId =
                        refund.ProviderRefundTransactionId,
                    ErrorMessage =
                        inquiryResult.ErrorMessage ??
                        "The refund status could not be verified with Paymob.",
                    ProviderResponse =
                        inquiryResult.ProviderResponse
                };
            }

            var transaction = inquiryResult.Transaction;

            if (transaction is null)
            {
                return new RefundResult
                {
                    Succeeded = false,
                    PendingVerification = true,
                    ProviderRefundTransactionId =
                        refund.ProviderRefundTransactionId,
                    ErrorMessage =
                        "Paymob did not return transaction details.",
                    ProviderResponse =
                        inquiryResult.ProviderResponse
                };
            }

            if (transaction.Id != transactionId)
            {
                return new RefundResult
                {
                    Succeeded = false,
                    PendingVerification = true,
                    ProviderRefundTransactionId =
                        refund.ProviderRefundTransactionId,
                    ErrorMessage =
                        "Paymob returned a different transaction during verification.",
                    ProviderResponse =
                        inquiryResult.ProviderResponse
                };
            }

            if (!transaction.Success)
            {
                return new RefundResult
                {
                    Succeeded = false,
                    PendingVerification = true,
                    ProviderRefundTransactionId =
                        refund.ProviderRefundTransactionId,
                    ErrorMessage =
                        "The Paymob transaction is not marked as successful.",
                    ProviderResponse =
                        inquiryResult.ProviderResponse
                };
            }

            if (transaction.AmountCents != expectedAmountCents)
            {
                return new RefundResult
                {
                    Succeeded = false,
                    PendingVerification = true,
                    ProviderRefundTransactionId =
                        refund.ProviderRefundTransactionId,
                    ErrorMessage =
                        "The Paymob transaction amount does not match the payment amount.",
                    ProviderResponse =
                        inquiryResult.ProviderResponse
                };
            }

            var refundedAmount =
                transaction.RefundedAmountCentsInt
                ?? transaction.RefundedAmountCents
                ?? 0;

            // ---------------------------------------------------------
            // CASE 1:
            // Paymob confirms that the refund already happened.
            // ---------------------------------------------------------

            if (transaction.IsRefunded &&
                refundedAmount >= expectedAmountCents)
            {
                refund.Status =
                    RefundStatus.Succeeded;

                // IMPORTANT:
                // transaction.Id is the ORIGINAL payment transaction ID.
                // Do NOT store it as ProviderRefundTransactionId.
                //
                // If ProviderRefundTransactionId was already known from
                // the original refund response, keep it.
                refund.ProviderRefundTransactionId =
                    refund.ProviderRefundTransactionId;

                refund.ProcessedAt =
                    DateTime.UtcNow;

                refund.FailureReason =
                    null;

                refund.ProviderResponse =
                    inquiryResult.ProviderResponse;

                payment.Status =
                    PaymentStatus.Refunded;

                await _unitOfWork.SaveChangesAsync();

                return new RefundResult
                {
                    Succeeded = true,
                    PendingVerification = false,
                    ProviderRefundTransactionId =
                        refund.ProviderRefundTransactionId,
                    ProviderResponse =
                        inquiryResult.ProviderResponse
                };
            }

            // ---------------------------------------------------------
            // CASE 2:
            // Paymob confirms that the refund has NOT happened.
            //
            // We now retry the refund.
            // ---------------------------------------------------------

            refund.Status =
                RefundStatus.Processing;

            refund.FailureReason =
                null;

            refund.ProviderResponse =
                inquiryResult.ProviderResponse;

            refund.ProcessedAt =
                null;

            await _unitOfWork.SaveChangesAsync();

            RefundResult retryResult;

            try
            {
                retryResult =
                    await _paymobService.RefundAsync(
                        secretKey,
                        transactionId,
                        expectedAmountCents);
            }
            catch (HttpRequestException ex)
            {
                refund.Status =
                    RefundStatus.PendingVerification;

                refund.FailureReason =
                    ex.Message;

                refund.ProviderResponse =
                    null;

                await _unitOfWork.SaveChangesAsync();

                return new RefundResult
                {
                    Succeeded = false,
                    PendingVerification = true,
                    ProviderRefundTransactionId =
                        refund.ProviderRefundTransactionId,
                    ErrorMessage =
                        "The refund request could not be confirmed with Paymob.",
                    ProviderResponse =
                        null
                };
            }
            catch (TaskCanceledException ex)
            {
                refund.Status =
                    RefundStatus.PendingVerification;

                refund.FailureReason =
                    ex.Message;

                refund.ProviderResponse =
                    null;

                await _unitOfWork.SaveChangesAsync();

                return new RefundResult
                {
                    Succeeded = false,
                    PendingVerification = true,
                    ProviderRefundTransactionId =
                        refund.ProviderRefundTransactionId,
                    ErrorMessage =
                        "The refund request timed out and could not be confirmed.",
                    ProviderResponse =
                        null
                };
            }

            // ---------------------------------------------------------
            // Retry succeeded.
            // ---------------------------------------------------------

            if (retryResult.Succeeded)
            {
                refund.Status =
                    RefundStatus.Succeeded;

                refund.ProviderRefundTransactionId =
                    retryResult.ProviderRefundTransactionId;

                refund.ProcessedAt =
                    DateTime.UtcNow;

                refund.FailureReason =
                    null;

                refund.ProviderResponse =
                    retryResult.ProviderResponse;

                payment.Status =
                    PaymentStatus.Refunded;

                await _unitOfWork.SaveChangesAsync();

                return new RefundResult
                {
                    Succeeded = true,
                    PendingVerification = false,
                    ProviderRefundTransactionId =
                        refund.ProviderRefundTransactionId,
                    ProviderResponse =
                        retryResult.ProviderResponse
                };
            }

            // ---------------------------------------------------------
            // Retry result is uncertain.
            // We still don't know whether Paymob processed it.
            // ---------------------------------------------------------

            if (retryResult.PendingVerification)
            {
                refund.Status =
                    RefundStatus.PendingVerification;

                refund.FailureReason =
                    retryResult.ErrorMessage ??
                    "The retry refund result could not be confirmed.";

                refund.ProviderResponse =
                    retryResult.ProviderResponse;

                await _unitOfWork.SaveChangesAsync();

                return new RefundResult
                {
                    Succeeded = false,
                    PendingVerification = true,
                    ProviderRefundTransactionId =
                        retryResult.ProviderRefundTransactionId,
                    ErrorMessage =
                        retryResult.ErrorMessage ??
                        "The retry refund result could not be confirmed.",
                    ProviderResponse =
                        retryResult.ProviderResponse
                };
            }

            // ---------------------------------------------------------
            // Retry failed definitively.
            // ---------------------------------------------------------

            refund.Status =
                RefundStatus.Failed;

            refund.FailureReason =
                retryResult.ErrorMessage ??
                "The refund retry failed.";

            refund.ProviderResponse =
                retryResult.ProviderResponse;

            await _unitOfWork.SaveChangesAsync();

            return new RefundResult
            {
                Succeeded = false,
                PendingVerification = false,
                ProviderRefundTransactionId =
                    retryResult.ProviderRefundTransactionId,
                ErrorMessage =
                    retryResult.ErrorMessage ??
                    "The refund retry failed.",
                ProviderResponse =
                    retryResult.ProviderResponse
            };
        }


        // =============================================================
        // Existing refund result helper
        // =============================================================

        private static RefundResult BuildResultFromExistingRefund(
            PaymentRefund refund)
        {
            return refund.Status switch
            {
                RefundStatus.Succeeded =>
                    new RefundResult
                    {
                        Succeeded = true,
                        PendingVerification = false,
                        ProviderRefundTransactionId =
                            refund.ProviderRefundTransactionId,
                        ProviderResponse =
                            refund.ProviderResponse
                    },

                RefundStatus.PendingVerification =>
                    new RefundResult
                    {
                        Succeeded = false,
                        PendingVerification = true,
                        ProviderRefundTransactionId =
                            refund.ProviderRefundTransactionId,
                        ErrorMessage =
                            "This refund is already pending verification.",
                        ProviderResponse =
                            refund.ProviderResponse
                    },

                RefundStatus.Processing =>
                    new RefundResult
                    {
                        Succeeded = false,
                        PendingVerification = true,
                        ErrorMessage =
                            "This refund is already being processed."
                    },

                RefundStatus.Failed =>
                    new RefundResult
                    {
                        Succeeded = false,
                        PendingVerification = false,
                        ErrorMessage =
                            refund.FailureReason ??
                            "The previous refund attempt failed.",
                        ProviderResponse =
                            refund.ProviderResponse
                    },

                _ =>
                    throw new InternalServerErrorException(
                        "The refund has an invalid status.")
            };
        }






        public async Task VerifyPendingRefundsAsync()
        {
            var refundRepository =
                _unitOfWork.GetRepository<PaymentRefund, int>();

            var pendingRefunds =
                await refundRepository.GetAllAsync(
                    PaymentRefundSpecifications.PendingVerification());

            foreach (var refund in pendingRefunds)
            {
                try
                {
                    await RefundPaymentAsync(
                        refund.PaymentId,
                        refund.Reason);
                }
                catch
                {
                    // Ignore this refund and continue processing the others.
                }
            }
        }


    }
}
