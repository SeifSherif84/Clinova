using Domain.Contracts;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Domain.Exceptions;
using Domain.Exceptions.BadRequest;
using Domain.Exceptions.Forbidden;
using Domain.Exceptions.InternalServerError;
using Domain.Exceptions.NotFound;
using Microsoft.EntityFrameworkCore;
using Services.Abstractions.DataProtection;
using Services.Abstractions.Notifications;
using Services.Abstractions.Payments;
using Services.Abstractions.Paymob;
using Services.Clinics;
using Services.Commen;
using Services.Paymob;
using Services.Specifications.Appointments;
using Services.Specifications.ClinicOnlinePaymentAccounts;
using Services.Specifications.ClinicPaymentIntegrations;
using Services.Specifications.Doctors;
using Services.Specifications.Payments;
using Shared.Dtos.Payments;
using Shared.Dtos.Paymob;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Payments
{
    public class PaymentService(IUnitOfWork _unitOfWork,
                               IPaymobService _paymobService,
                               IPaymobHmacService _paymobHmacService,
                               IPaymentCredentialEncryptor _credentialProtector,
                               INotificationService _notificationService,
                               IPaymobRefundService _refundService) : IPaymentService
    {
        public async Task<object> CreatePaymobPaymentIntentionAsync(string userId, int appointmentId, CreatePaymobPaymentIntentionRequest request)
        {
            // --------------------------------------------------
            // 1. Validate User
            // --------------------------------------------------

            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var patient = await _unitOfWork.GetRepository<Patient, string>().GetByIdAsync(userId);
            if (patient is null)
                throw new NotFoundException("We couldn't find your account.");


            // --------------------------------------------------
            // 2. Validate Payment Method
            // --------------------------------------------------

            if (!Enum.IsDefined<OnlinePaymentMethod>(request.PaymentMethod))
                throw new BadRequestException("Invalid online payment method.");



            // --------------------------------------------------
            // 3. Get Appointment
            // --------------------------------------------------

            var appointmentRepo = _unitOfWork.GetRepository<Appointment, int>();
            var appointmentSpec = AppointmentSpecifications.ById(appointmentId);
            var appointment = await appointmentRepo.GetByIdAsync(appointmentSpec);

            if (appointment is null)
                throw new NotFoundException("The appointment was not found.");


            // --------------------------------------------------
            // 4. Ownership
            // --------------------------------------------------

            if (appointment.PatientId != userId)
                throw new ResourceAccessDeniedException("You are not authorized to make payment for this appointment.");



            // --------------------------------------------------
            // 5. Appointment Status
            // --------------------------------------------------

            if (appointment.Status != AppointmentStatus.PendingPayment)
                throw new BadRequestException("This appointment is no longer awaiting payment.");


            // --------------------------------------------------
            // 6. Reservation Expiration
            // --------------------------------------------------

            if (DateTime.UtcNow >= appointment.ReservationExpiresAt)
            {
                throw new BadRequestException("The payment reservation for this appointment has expired.");
            }



            // --------------------------------------------------
            // 7. Payment Status
            // --------------------------------------------------

            if (appointment.Payment is null)
                throw new InternalServerErrorException("The appointment payment was not found.");

            if (appointment.Payment.Status is not (PaymentStatus.Pending or PaymentStatus.Failed))
                throw new BadRequestException("This appointment payment is no longer payable.");

            if (appointment.Payment.Status == PaymentStatus.Failed)
            {
                appointment.Payment.ProviderPaymentIntentId = null;
                appointment.Payment.ProviderOrderId = null;
                appointment.Payment.ProviderClientSecret = null;
                appointment.Payment.Status = PaymentStatus.Pending;
            }




            // --------------------------------------------------
            // 8. Existing Paymob Intention
            // --------------------------------------------------

            if (appointment.Payment.Status == PaymentStatus.Pending &&
                !string.IsNullOrWhiteSpace(appointment.Payment.ProviderPaymentIntentId))
            {
                if (string.IsNullOrWhiteSpace(appointment.Payment.ProviderClientSecret))
                    throw new InternalServerErrorException("The existing payment session is incomplete.");

                return new
                {
                    clientSecret = appointment.Payment.ProviderClientSecret,
                    publicKey = appointment.Payment.ClinicOnlinePaymentAccount?.PublicKey,
                    message = "Your existing payment session is ready."
                };
            }


            // --------------------------------------------------
            // 9. Get Clinic
            // --------------------------------------------------

            // check clinic doctor , member
            var clinicId = appointment.AppointmentSlot.ClinicId;

            var onlinePaymentAccountRepo = _unitOfWork.GetRepository<ClinicOnlinePaymentAccount, int>();
            var onlinePaymentAccountSpec = ClinicOnlinePaymentAccountSpecifications.ByClinicAndProvider(clinicId, OnlinePaymentProvider.Paymob);
            var paymobAccount = await onlinePaymentAccountRepo.GetByIdAsync(onlinePaymentAccountSpec);

            if (paymobAccount is null)
                throw new BadRequestException("Online payment is not configured for this clinic.");



            // --------------------------------------------------
            // 10. Validate Account Status
            // --------------------------------------------------

            if (paymobAccount.Status == OnlinePaymentAccountStatus.Disabled)
                throw new BadRequestException("Online payment Account is currently disabled for this clinic.");

            if (paymobAccount.Status == OnlinePaymentAccountStatus.Restricted)
                throw new BadRequestException("Online payment Account is currently unavailable for this clinic.");

            if (paymobAccount.Status == OnlinePaymentAccountStatus.NotConfigured)
                throw new BadRequestException("Online payment is not configured for this clinic.");


            // --------------------------------------------------
            // 11. Get Integration
            // --------------------------------------------------

            var integrationRepo = _unitOfWork.GetRepository<ClinicPaymentIntegration, int>();
            var integrationSpec = ClinicPaymentIntegrationSpecifications.ByAccountAndPaymentMethod(paymobAccount.Id, request.PaymentMethod);
            var integration = await integrationRepo.GetByIdAsync(integrationSpec);

            if (integration is null)
                throw new BadRequestException($"Online payment using {request.PaymentMethod} is not configured for this clinic.");

            if (!integration.IsActive)
                throw new BadRequestException($"Online payment using {request.PaymentMethod} is currently unavailable.");


            // --------------------------------------------------
            // 12. Decrypt Paymob Secret Key
            // --------------------------------------------------

            string secretKey;

            try
            {
                secretKey = _credentialProtector.Decrypt(paymobAccount.SecretKey);
            }
            catch
            {
                throw new InternalServerErrorException("The Paymob payment configuration could not be loaded.");
            }


            // --------------------------------------------------
            // 13. Convert Amount to Cents
            // --------------------------------------------------

            var amountInCents = checked((int)Math.Round(appointment.Payment.Amount * 100m, 0, MidpointRounding.AwayFromZero));

            if (amountInCents <= 0)
                throw new BadRequestException("The payment amount must be greater than zero.");



            // --------------------------------------------------
            // 14. Build Paymob Intention
            // --------------------------------------------------

            var patientFullName = $"{patient.FirstName} {patient.LastName}".Trim();

            var paymobRequest = new PaymobCreateIntentionRequest()
                {
                    Amount = amountInCents,
                    Currency = "EGP",

                    PaymentMethods = new List<int>
                    {
                        integration.IntegrationId
                    },

                    Items = new List<PaymobItem>()
                    {
                        new PaymobItem
                        {
                            Name = "Clinic Appointment Deposit",
                            Amount = amountInCents,
                            Description = $"Deposit payment for appointment #{appointment.Id}",
                            Quantity = 1
                        }
                    },

                    BillingData = new PaymobBillingData
                    {
                        Apartment = "1",
                        Floor = "1",
                        Street = "Test Street",
                        Building = "1",
                        City = "Cairo",
                        State = "Cairo",
                        Country = "EGY",
                        FirstName = patient.FirstName,
                        LastName = patient.LastName,
                        PhoneNumber = patient.PhoneNumber ?? throw new BadRequestException("A phone number is required to complete online payment."),
                        Email = patient.Email,
                    },

                    SpecialReference = $"CLINOVA-APPOINTMENT-{appointment.Id}",

                    Extras = new Dictionary<string, object>
                    {
                        ["appointment_id"] = appointment.Id,
                        ["clinic_id"] = clinicId,
                        ["patient_id"] = userId
                    },

                    NotificationUrl = "https://qpgvcm3j-7269.uks1.devtunnels.ms/api/payments/paymob/transaction-callback",
                    Expiration = 1800
                };


            // --------------------------------------------------
            // 15. Call Paymob
            // --------------------------------------------------

            PaymobCreateIntentionResponse paymobResponse;

            try
            {
                paymobResponse = await _paymobService.CreatePaymentIntentionAsync(secretKey, paymobRequest);
            }
            catch (PaymobApiException ex)
            when (ex.ConfigurationIssueCode.HasValue)
            {
                await MarkConfigurationIssueAsync(paymobAccount, ex.ConfigurationIssueCode.Value);
                await _unitOfWork.SaveChangesAsync();
                throw new BadRequestException("There is a problem with the clinic's online payment configuration.");
            }
            catch (PaymobApiException)
            {
                throw new BadRequestException("The payment provider is temporarily unavailable. Please try again later.");
            }


            // --------------------------------------------------
            // 16. Save Paymob Information
            // --------------------------------------------------

            appointment.Payment.ClinicOnlinePaymentAccountId = paymobAccount.Id;
            appointment.Payment.ProviderPaymentIntentId =  paymobResponse.Id;
            appointment.Payment.ProviderOrderId = paymobResponse.IntentionOrderId.ToString();
            appointment.Payment.ProviderClientSecret = paymobResponse.ClientSecret;


            // --------------------------------------------------
            // 17. Successful real Paymob request
            // --------------------------------------------------

            if (paymobAccount.Status is OnlinePaymentAccountStatus.PendingVerification or OnlinePaymentAccountStatus.NeedsAttention)
            {
                paymobAccount.Status = OnlinePaymentAccountStatus.Ready;
                paymobAccount.LastConfigurationIssueCode = null;
                paymobAccount.LastConfigurationIssueAt = null;
            }


            var result = await _unitOfWork.SaveChangesAsync();

            if (result == 0)
                throw new InternalServerErrorException("The payment session was created but could not be saved.");


            // --------------------------------------------------
            // 18. Return only what Frontend needs
            // --------------------------------------------------

            return new
            {
                clientSecret = paymobResponse.ClientSecret,
                publicKey = paymobAccount.PublicKey,
                message = "Payment session created successfully."
            };
        }


        public async Task HandlePaymobTransactionCallbackAsync(PaymobTransactionCallbackRequest request, string hmac)
        {
            // --------------------------------------------------
            // 1. Validate Callback Payload
            // --------------------------------------------------

            if (request is null)
                throw new BadRequestException("Invalid Paymob callback.");

            if (request.Obj is null)
                throw new BadRequestException("Invalid Paymob transaction data.");

            var transaction = request.Obj;


            // --------------------------------------------------
            // 2. Validate Required Paymob Data
            // --------------------------------------------------

            if (transaction.Id <= 0)
                throw new BadRequestException("Invalid Paymob transaction ID.");

            if (transaction.Order is null || transaction.Order.Id <= 0)
                throw new BadRequestException("Invalid Paymob order ID.");

            if (transaction.IntegrationId <= 0)
                throw new BadRequestException("Invalid Paymob integration ID.");

            if (string.IsNullOrWhiteSpace(hmac))
                throw new BadRequestException("Paymob callback HMAC is missing.");


            // --------------------------------------------------
            // 3. Find Payment by Paymob Order ID
            // --------------------------------------------------

            var paymentRepo =
                _unitOfWork.GetRepository<Payment, int>();

            var paymentSpec =
                PaymentSpecifications.ByProviderOrderId(
                    transaction.Order.Id.ToString());

            var payment =
                await paymentRepo.GetByIdAsync(paymentSpec);

            if (payment is null)
                throw new NotFoundException(
                    "The payment associated with this Paymob transaction was not found.");


            // --------------------------------------------------
            // 4. Validate Payment Provider
            // --------------------------------------------------

            var paymentAccount =
                payment.ClinicOnlinePaymentAccount;

            if (paymentAccount is null)
                throw new InternalServerErrorException(
                    "The online payment account associated with this payment was not found.");

            if (paymentAccount.Provider != OnlinePaymentProvider.Paymob)
                throw new BadRequestException(
                    "The payment provider does not match Paymob.");


            // --------------------------------------------------
            // 5. Decrypt HMAC Secret
            // --------------------------------------------------

            string hmacSecret;

            try
            {
                hmacSecret =
                    _credentialProtector.Decrypt(
                        paymentAccount.HmacSecret);
            }
            catch
            {
                throw new InternalServerErrorException(
                    "The Paymob HMAC configuration could not be loaded.");
            }


            // --------------------------------------------------
            // 6. Verify HMAC
            // --------------------------------------------------

            var isValidHmac =
                _paymobHmacService.IsValid(
                    transaction,
                    hmac,
                    hmacSecret);

            if (!isValidHmac)
                throw new BadRequestException(
                    "Invalid Paymob callback signature.");


            // --------------------------------------------------
            // 7. Validate Integration ID
            // --------------------------------------------------

            var configuredIntegration =
                paymentAccount.PaymentIntegrations.FirstOrDefault(
                    integration =>
                        integration.IntegrationId ==
                        transaction.IntegrationId &&
                        integration.IsActive);

            if (configuredIntegration is null)
            {
                await MarkConfigurationIssueAsync(
                    paymentAccount,
                    PaymentConfigurationIssueCode.InvalidIntegration);

                await _unitOfWork.SaveChangesAsync();

                throw new BadRequestException(
                    "The Paymob integration does not match the configured payment integration.");
            }


            // --------------------------------------------------
            // 8. Validate Currency
            // --------------------------------------------------

            if (!string.Equals(
                    transaction.Currency,
                    "EGP",
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new BadRequestException(
                    "The Paymob transaction currency is invalid.");
            }


            // --------------------------------------------------
            // 9. Validate Amount
            // --------------------------------------------------

            var expectedAmountCents =
                checked(
                    (int)Math.Round(
                        payment.Amount * 100m,
                        0,
                        MidpointRounding.AwayFromZero));

            if (transaction.AmountCents != expectedAmountCents)
            {
                throw new BadRequestException(
                    "The Paymob transaction amount does not match the payment amount.");
            }


            // --------------------------------------------------
            // 10. Idempotency
            // --------------------------------------------------
            //
            // If the payment was already successfully processed,
            // ignore duplicate Paymob callbacks.
            //

            if (payment.Status == PaymentStatus.Paid)
                return;


            // --------------------------------------------------
            // 11. Handle Transaction Result
            // --------------------------------------------------

            if (transaction.Success)
            {
                await HandleSuccessfulPaymentAsync(
                    payment,
                    transaction);

                return;
            }

            await HandleFailedPaymentAsync(
                payment,
                transaction);
        }



        private async Task RefundSuccessfulPaymentAfterAppointmentBecameInvalid(
            Payment payment,
            RefundReason reason)
        {
            var refundResult =
                await _refundService.RefundPaymentAsync(
                    payment.Id,
                    reason);

            if (refundResult.Succeeded)
                return;

            // The refund record is already stored as
            // PendingVerification by RefundService.
            //
            // We intentionally do not throw here because the
            // payment itself was already successful and the
            // appointment must remain invalid.
            if (refundResult.PendingVerification)
                return;

            throw new InternalServerErrorException(
                refundResult.ErrorMessage ??
                "The payment was successful, but the refund could not be completed.");
        }


        private async Task HandleSuccessfulPaymentAsync(
            Payment payment,
            PaymobTransactionCallbackObject transaction)
        {
            // --------------------------------------------------
            // 1. Get Appointment
            // --------------------------------------------------

            var appointment = payment.Appointment;

            if (appointment is null)
            {
                throw new InternalServerErrorException(
                    "The appointment associated with this payment was not found.");
            }

            if (appointment.AppointmentSlot is null)
            {
                throw new InternalServerErrorException(
                    "The appointment slot associated with this payment was not found.");
            }


            // --------------------------------------------------
            // 2. Idempotency
            // --------------------------------------------------

            if (payment.Status == PaymentStatus.Paid)
                return;


            // --------------------------------------------------
            // 3. Record Successful Paymob Transaction
            // --------------------------------------------------

            payment.Status = PaymentStatus.Paid;
            payment.PaidAt = DateTime.UtcNow;
            payment.ProviderTransactionId = transaction.Id.ToString();
            payment.TransactionReference = transaction.Id.ToString();


            // --------------------------------------------------
            // 4. Patient Already Cancelled Appointment
            // --------------------------------------------------

            if (appointment.Status == AppointmentStatus.Cancelled)
            {
                try
                {
                    var result = await _unitOfWork.SaveChangesAsync();

                    if (result == 0)
                    {
                        throw new InternalServerErrorException(
                            "The successful payment could not be recorded.");
                    }
                }
                catch (DbUpdateConcurrencyException)
                {
                    throw new InternalServerErrorException(
                        "The appointment or payment was modified by another operation. Please try again.");
                }

                await RefundSuccessfulPaymentAfterAppointmentBecameInvalid(
                    payment,
                    RefundReason.PatientCancellation);

                return;
            }


            // --------------------------------------------------
            // 5. Reservation Expired
            // --------------------------------------------------

            var reservationExpired =
                DateTime.UtcNow >= appointment.ReservationExpiresAt;

            if (appointment.Status == AppointmentStatus.Expired ||
                reservationExpired)
            {
                if (appointment.Status == AppointmentStatus.PendingPayment)
                {
                    appointment.Status = AppointmentStatus.Expired;
                }

                try
                {
                    var result = await _unitOfWork.SaveChangesAsync();

                    if (result == 0)
                    {
                        throw new InternalServerErrorException(
                            "The successful payment could not be recorded.");
                    }
                }
                catch (DbUpdateConcurrencyException)
                {
                    throw new InternalServerErrorException(
                        "The appointment or payment was modified by another operation. Please try again.");
                }

                await RefundSuccessfulPaymentAfterAppointmentBecameInvalid(
                    payment,
                    RefundReason.LatePaymentAfterReservationExpiration);

                return;
            }


            // --------------------------------------------------
            // 6. Appointment Must Still Be Pending Payment
            // --------------------------------------------------

            if (appointment.Status != AppointmentStatus.PendingPayment)
            {
                throw new BadRequestException(
                    "The appointment is no longer awaiting payment.");
            }


            // --------------------------------------------------
            // 7. Confirm Appointment
            // --------------------------------------------------

            appointment.Status = AppointmentStatus.Confirmed;
            appointment.AppointmentSlot.Status = SlotStatus.Booked;


            // --------------------------------------------------
            // 8. Save Final State
            // --------------------------------------------------

            try
            {
                var result = await _unitOfWork.SaveChangesAsync();

                if (result == 0)
                {
                    throw new InternalServerErrorException(
                        "The payment was received but the appointment status could not be updated.");
                }
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new InternalServerErrorException(
                    "The appointment or payment was modified by another operation. Please try again.");
            }
        }


        private async Task HandleFailedPaymentAsync(
            Payment payment,
            PaymobTransactionCallbackObject transaction)
        {
            // --------------------------------------------------
            // Idempotency
            // --------------------------------------------------

            if (payment.Status == PaymentStatus.Paid)
                return;


            // --------------------------------------------------
            // Save Failed Payment
            // --------------------------------------------------

            payment.Status = PaymentStatus.Failed;
            payment.ProviderTransactionId = transaction.Id.ToString();
            payment.TransactionReference = transaction.Id.ToString();


            // --------------------------------------------------
            // Appointment remains PendingPayment.
            // Slot remains Reserved until ReservationExpiresAt.
            // --------------------------------------------------

            try
            {
                var result = await _unitOfWork.SaveChangesAsync();

                if (result == 0)
                {
                    throw new InternalServerErrorException(
                        "The payment failure could not be recorded.");
                }
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new InternalServerErrorException(
                    "The payment was modified by another operation. Please try again.");
            }
        }


        private async Task MarkConfigurationIssueAsync(ClinicOnlinePaymentAccount paymentAccount, PaymentConfigurationIssueCode issueCode)
        {
            var isFirstConfigurationFailure = paymentAccount.Status != OnlinePaymentAccountStatus.NeedsAttention;

            paymentAccount.Status = OnlinePaymentAccountStatus.NeedsAttention;
            paymentAccount.LastConfigurationIssueCode = issueCode;
            paymentAccount.LastConfigurationIssueAt = DateTime.UtcNow;


            // Do not create a notification every time
            // another patient encounters the same issue.
            if (!isFirstConfigurationFailure)
                return;


            var ownerDoctorSpec = new DoctorSpecifications(paymentAccount.ClinicId, ClinicDoctorScope.Owner);
            var owner = await _unitOfWork.GetRepository<Doctor, string>().GetByIdAsync(ownerDoctorSpec);
            if (owner is null)
                throw new InternalServerErrorException("The clinic owner could not be found.");


            await _notificationService.CreateAndSendAsync(owner.Id,
                                                          "Paymob connection needs attention",
                                                          "A recent online payment request could not be completed using your clinic's Paymob configuration. Please review your payment settings.",
                                                          NotificationType.PaymentConfigurationIssue);
        }



        public async Task<PaymentConfigurationStatusResponse> GetPaymentConfigurationStatusAsync(string userId, int clinicId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");


            // Only clinic owner can manage/view
            // the clinic payment configuration.
            await GetDoctorOwnedClinicAccessAsync(userId, clinicId);


            var accountRepo = _unitOfWork.GetRepository<ClinicOnlinePaymentAccount, int>();
            var accountSpec = ClinicOnlinePaymentAccountSpecifications.ByClinicAndProvider(clinicId, OnlinePaymentProvider.Paymob);
            var account = await accountRepo.GetByIdAsync(accountSpec);


            if (account is null)
            {
                return new PaymentConfigurationStatusResponse
                {
                    Provider = "Paymob",
                    Status = "NotConfigured",
                    IssueCode = null,
                    LastIssueAt = null,
                    Message = "Online payments are not configured for this clinic."
                };
            }


            var status = account.Status switch
            {
                OnlinePaymentAccountStatus.NotConfigured => "NotConfigured",
                OnlinePaymentAccountStatus.PendingVerification => "Connected",
                OnlinePaymentAccountStatus.Ready => "Connected",
                OnlinePaymentAccountStatus.NeedsAttention => "NeedsAttention",
                OnlinePaymentAccountStatus.Restricted => "NeedsAttention",
                OnlinePaymentAccountStatus.Disabled => "Disabled",
                _ => "NotConfigured"
            };


            var message = account.Status switch
            {
                OnlinePaymentAccountStatus.Ready => "Online payments are enabled for this clinic.",
                OnlinePaymentAccountStatus.PendingVerification => "Online payments are configured for this clinic.",
                OnlinePaymentAccountStatus.NeedsAttention => "Your Paymob configuration needs attention. Please review your payment settings.",
                OnlinePaymentAccountStatus.Restricted => "Your Paymob payment configuration is currently unavailable.",
                OnlinePaymentAccountStatus.Disabled => "Online payments are disabled for this clinic.",
                _ => "Online payments are not configured for this clinic."
            };


            return new PaymentConfigurationStatusResponse
            {
                Provider = "Paymob",
                Status = status,
                IssueCode = account.LastConfigurationIssueCode?.ToString(),
                LastIssueAt = account.LastConfigurationIssueAt,
                Message = message
            };
        }



        private async Task<DoctorClinicContext> GetDoctorOwnedClinicAccessAsync(string userId, int clinicId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");


            var doctor = await _unitOfWork.GetRepository<Doctor, string>().GetByIdAsync(userId);
            if (doctor is null)
                throw new NotFoundException("We couldn't find your account.");


            var clinic = await _unitOfWork.GetRepository<Clinic, int>().GetByIdAsync(clinicId);
            if (clinic is null)
                throw new NotFoundException("The clinic you are trying to access does not exist.");


            var doctorClinic = await _unitOfWork.GetRepository<DoctorClinic>().GetByCompositeKeyAsync(doctor.Id, clinic.Id);
            if (doctorClinic is null)
                throw new ResourceAccessDeniedException("You don't have access to this clinic.");
            if (!doctorClinic.IsOwner)
                throw new ResourceAccessDeniedException("Only the clinic owner can make this action.");


            return new DoctorClinicContext
            {
                Doctor = doctor,
                Clinic = clinic,
                DoctorClinic = doctorClinic,
                IsOwner = doctorClinic.IsOwner,
            };
        }

    }
}
