using Domain.Contracts;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Domain.Exceptions.BadRequest;
using Domain.Exceptions.Forbidden;
using Domain.Exceptions.InternalServerError;
using Domain.Exceptions.NotFound;
using Services.Abstractions.DataProtection;
using Services.Abstractions.Payments;
using Services.Abstractions.Paymob;
using Services.Paymob;
using Services.Specifications.Appointments;
using Services.Specifications.ClinicOnlinePaymentAccounts;
using Services.Specifications.ClinicPaymentIntegrations;
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
    internal class PaymentService(IUnitOfWork _unitOfWork,
                                  IPaymobService _paymobService,
                                  IPaymobHmacService _paymobHmacService,
                                  IPaymentCredentialEncryptor _credentialProtector) : IPaymentService
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
                    message = "Your existing payment session is ready."
                };
            }


            // --------------------------------------------------
            // 9. Get Clinic
            // --------------------------------------------------

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
                        FirstName = patient.FirstName,
                        LastName = patient.LastName,
                        PhoneNumber = patient.PhoneNumber ?? throw new BadRequestException("A phone number is required to complete online payment."),
                        Email = patient.Email,
                        Country = "EGY"
                    },

                    SpecialReference = $"CLINOVA-APPOINTMENT-{appointment.Id}",

                    Extras = new Dictionary<string, object>
                    {
                        ["appointment_id"] = appointment.Id,
                        ["clinic_id"] = clinicId,
                        ["patient_id"] = userId
                    },

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
            // Must be handle in feature (handle Paymob errors)
            catch (BadRequestException)
            {
                //paymobAccount.Status = OnlinePaymentAccountStatus.Restricted;
                //await _unitOfWork.SaveChangesAsync();
                throw;
            }


            // --------------------------------------------------
            // 16. Save Paymob Information
            // --------------------------------------------------

            appointment.Payment.ProviderPaymentIntentId =  paymobResponse.Id;
            appointment.Payment.ProviderOrderId = paymobResponse.IntentionOrderId.ToString();
            appointment.Payment.ProviderClientSecret = paymobResponse.ClientSecret;


            // --------------------------------------------------
            // 17. Successful real Paymob request
            // --------------------------------------------------

            if (paymobAccount.Status == OnlinePaymentAccountStatus.PendingVerification)
                paymobAccount.Status = OnlinePaymentAccountStatus.Ready;


            var result = await _unitOfWork.SaveChangesAsync();

            if (result == 0)
                throw new InternalServerErrorException("The payment session was created but could not be saved.");


            // --------------------------------------------------
            // 18. Return only what Frontend needs
            // --------------------------------------------------

            return new
            {
                clientSecret = paymobResponse.ClientSecret,
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

            var paymentRepo = _unitOfWork.GetRepository<Payment, int>();
            var paymentSpec = PaymentSpecifications.ByProviderOrderId(transaction.Order.Id.ToString());
            var payment = await paymentRepo.GetByIdAsync(paymentSpec);

            if (payment is null)
                throw new NotFoundException("The payment associated with this Paymob transaction was not found.");


            // --------------------------------------------------
            // 4. Validate Payment Provider
            // --------------------------------------------------

            var paymentAccount = payment.ClinicOnlinePaymentAccount;

            if (paymentAccount is null)
                throw new InternalServerErrorException("The online payment account associated with this payment was not found.");


            if (paymentAccount.Provider != OnlinePaymentProvider.Paymob)
                throw new BadRequestException("The payment provider does not match Paymob.");


            // --------------------------------------------------
            // 5. Decrypt HMAC Secret
            // --------------------------------------------------

            string hmacSecret;

            try
            {
                hmacSecret = _credentialProtector.Decrypt(paymentAccount.HmacSecret);
            }
            catch
            {
                throw new InternalServerErrorException("The Paymob HMAC configuration could not be loaded.");
            }


            // --------------------------------------------------
            // 6. Verify HMAC
            // --------------------------------------------------

            var isValidHmac = _paymobHmacService.IsValid(transaction, hmac, hmacSecret);

            if (!isValidHmac)
                throw new BadRequestException("Invalid Paymob callback signature.");



            // --------------------------------------------------
            // 7. Validate Integration ID
            // --------------------------------------------------

            var configuredIntegration = paymentAccount.PaymentIntegrations.FirstOrDefault(integration =>
                        integration.IntegrationId == transaction.IntegrationId && integration.IsActive);

            if (configuredIntegration is null)
                throw new BadRequestException("The Paymob integration does not match the configured payment integration.");


            // --------------------------------------------------
            // 8. Validate Currency
            // --------------------------------------------------

            if (!string.Equals(transaction.Currency, "EGP", StringComparison.OrdinalIgnoreCase))
                throw new BadRequestException("The Paymob transaction currency is invalid.");


            // --------------------------------------------------
            // 9. Validate Amount
            // --------------------------------------------------

            var expectedAmountCents = checked((int)Math.Round(payment.Amount * 100m, 0, MidpointRounding.AwayFromZero));

            if (transaction.AmountCents != expectedAmountCents)
                throw new BadRequestException("The Paymob transaction amount does not match the payment amount.");



            // --------------------------------------------------
            // 10. Validate Payment Intention
            // --------------------------------------------------

            if (!string.IsNullOrWhiteSpace(payment.ProviderPaymentIntentId))
            {
                // Intention ID is not directly present as a top-level
                // transaction callback field, so Order ID remains
                // our primary correlation identifier.
            }


            // --------------------------------------------------
            // 11. Idempotency
            // --------------------------------------------------

            if (payment.Status == PaymentStatus.Paid)
            {
                // Paymob may send the same callback more than once.
                // We already processed it successfully.
                return;
            }


            // --------------------------------------------------
            // 12. Handle Successful Payment
            // --------------------------------------------------

            if (transaction.Success)
                await HandleSuccessfulPaymentAsync(payment, transaction);

            else
                await HandleFailedPaymentAsync(payment, transaction);
        }


        private async Task HandleSuccessfulPaymentAsync(Payment payment, PaymobTransactionCallbackObject transaction)
        {
            var appointment = payment.Appointment;

            if (appointment is null)
                throw new InternalServerErrorException("The appointment associated with this payment was not found.");



            // --------------------------------------------------
            // Payment already finalized
            // --------------------------------------------------

            if (payment.Status == PaymentStatus.Paid)
                return;


            // --------------------------------------------------
            // Validate Appointment State
            // --------------------------------------------------

            if (appointment.Status == AppointmentStatus.Cancelled)
                throw new BadRequestException("The appointment has already been cancelled.");

            if (appointment.Status == AppointmentStatus.Completed)
                throw new BadRequestException("The appointment has already been completed.");

            if (appointment.Status == AppointmentStatus.NoShow)
                throw new BadRequestException("The appointment has already been marked as no-show.");


            // --------------------------------------------------
            // Update Payment
            // --------------------------------------------------
            // must be reviewed (payment paid before check appointment become expired or not if expired the appointment become expired and payment paid this is not logic)
            payment.Status = PaymentStatus.Paid;
            payment.PaidAt = DateTime.UtcNow;
            payment.ProviderTransactionId = transaction.Id.ToString();
            payment.TransactionReference = transaction.Id.ToString();


            // --------------------------------------------------
            // Update Appointment and Slot
            // --------------------------------------------------

            if (appointment.Status == AppointmentStatus.PendingPayment && 
                appointment.ReservationExpiresAt > DateTime.UtcNow)
            {
                appointment.Status = AppointmentStatus.Confirmed;
                appointment.AppointmentSlot.Status = SlotStatus.Booked;
            }
            else
            {
                // Appointment expired before payment callback arrived.
                // Do not confirm or book the slot.
                // Must be handle in feature (Refund) the deposit
            }



            // --------------------------------------------------
            // Save
            // --------------------------------------------------

            var result = await _unitOfWork.SaveChangesAsync();

            if (result == 0)
                throw new InternalServerErrorException("The payment was received but the appointment status could not be updated.");
        }


        private async Task HandleFailedPaymentAsync(Payment payment, PaymobTransactionCallbackObject transaction)
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
            // IMPORTANT:
            // Appointment remains PendingPayment.
            // Slot remains Reserved until ReservationExpiresAt.
            // --------------------------------------------------

            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException("The payment failure could not be recorded.");

        }

    }
}
