using AutoMapper;
using Domain.Contracts;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Domain.Exceptions.BadRequest;
using Domain.Exceptions.Forbidden;
using Domain.Exceptions.InternalServerError;
using Domain.Exceptions.NotFound;
using Services.Abstractions.ClinicOnlinePaymentAccounts;
using Services.Abstractions.DataProtection;
using Services.Commen;
using Services.Specifications.ClinicManualPaymentMethods;
using Services.Specifications.ClinicOnlinePaymentAccounts;
using Services.Specifications.ClinicPaymentIntegrations;
using Shared.Dtos.ClinicOnlinePaymentAccounts;
using Shared.Dtos.ClinicPaymentIntegrations;
using Stripe;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.ClinicOnlinePaymentAccounts
{
    internal class ClinicOnlinePaymentAccountService(IUnitOfWork _unitOfWork,
                                                     IPaymentCredentialEncryptor _credentialProtector) : IClinicOnlinePaymentAccountService
    {
        public async Task<string> ConfigurePaymobAccountAsync(string userId, int clinicId, ConfigurePaymobAccountRequest request)
        {
            await GetDoctorOwnedClinicAccessAsync(userId, clinicId);

            var onlinePaymentAccountRepo = _unitOfWork.GetRepository<ClinicOnlinePaymentAccount, int>();
            var onlinePaymentAccountSpec = ClinicOnlinePaymentAccountSpecifications.ByClinicAndProvider(clinicId, OnlinePaymentProvider.Paymob);
            var existingAccount = await onlinePaymentAccountRepo.GetByIdAsync(onlinePaymentAccountSpec);

            if (existingAccount is not null)
                throw new BadRequestException("A Paymob account is already configured for this clinic.");


            var onlinePaymentAccount = new ClinicOnlinePaymentAccount()
            {
                Provider = OnlinePaymentProvider.Paymob,
                PublicKey = request.PublicKey.Trim(),
                SecretKey = _credentialProtector.Encrypt(request.SecretKey.Trim()),
                HmacSecret = _credentialProtector.Encrypt(request.HmacSecret.Trim()),
                ApiKey = _credentialProtector.Encrypt(request.ApiKey.Trim()),
                ClinicId = clinicId,
                Status = OnlinePaymentAccountStatus.PendingVerification
            };

            await onlinePaymentAccountRepo.AddAsync(onlinePaymentAccount);

            int result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException("Failed to save Paymob account configuration.");

            return "Your Paymob credentials were saved and are pending verification.";
        }


        public async Task<string> UpdatePaymobAccountAsync(string userId, int accountId, int clinicId, UpdatePaymobAccountRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.PublicKey) &&
                string.IsNullOrWhiteSpace(request.SecretKey) &&
                string.IsNullOrWhiteSpace(request.HmacSecret) &&
                string.IsNullOrWhiteSpace(request.ApiKey))
            {
                throw new BadRequestException(
                    "Please provide at least one field to update.");
            }

            var onlinePaymentAccountRepo = _unitOfWork.GetRepository<ClinicOnlinePaymentAccount, int>();
            var existingOnlinePaymentAccount = await onlinePaymentAccountRepo.GetByIdAsync(accountId);

            if (existingOnlinePaymentAccount is null)
                throw new NotFoundException("The specified online payment account was not found.");

            await GetDoctorOwnedClinicAccessAsync(userId, existingOnlinePaymentAccount.ClinicId);

            if (existingOnlinePaymentAccount.ClinicId != clinicId)
                throw new BadRequestException("The specified online payment account does not belong to this clinic.");

            if (existingOnlinePaymentAccount.Provider != OnlinePaymentProvider.Paymob)
                throw new BadRequestException("The specified account is not a Paymob account.");

            bool hasChanges = false;

            if (!string.IsNullOrWhiteSpace(request.PublicKey) && existingOnlinePaymentAccount.PublicKey != request.PublicKey)
            {
                existingOnlinePaymentAccount.PublicKey = request.PublicKey.Trim();
                hasChanges = true;
            }
                

            if (!string.IsNullOrWhiteSpace(request.SecretKey) && existingOnlinePaymentAccount.SecretKey != request.SecretKey)
            {
                existingOnlinePaymentAccount.SecretKey = _credentialProtector.Encrypt(request.SecretKey.Trim());
                hasChanges = true;
            }


            if (!string.IsNullOrWhiteSpace(request.HmacSecret) && existingOnlinePaymentAccount.HmacSecret != request.HmacSecret)
            {
                existingOnlinePaymentAccount.HmacSecret = _credentialProtector.Encrypt(request.HmacSecret.Trim());
                hasChanges = true;
            }
            

            if (!string.IsNullOrWhiteSpace(request.ApiKey) && existingOnlinePaymentAccount.ApiKey != request.ApiKey)
            {
                existingOnlinePaymentAccount.ApiKey = _credentialProtector.Encrypt(request.ApiKey.Trim());
                hasChanges = true;
            }


            if (!hasChanges)
                return "No changes were made to the Paymob account credentials.";

            existingOnlinePaymentAccount.Status = OnlinePaymentAccountStatus.PendingVerification;

            int result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException("Failed to update Paymob account credentials.");

            return "Your Paymob account credentials were updated and are pending verification.";
        }


        public async Task<IEnumerable<ClinicOnlinePaymentAccountResponseForOwner>> GetPaymentAccountsAsync(string userId, int clinicId)
        {
            await GetDoctorOwnedClinicAccessAsync(userId, clinicId);

            var onlinePaymentAccountRepo = _unitOfWork.GetRepository<ClinicOnlinePaymentAccount, int>();
            var onlinePaymentAccountSpec = ClinicOnlinePaymentAccountSpecifications.ByClinic(clinicId);
            var onlinePaymentAccounts = await onlinePaymentAccountRepo.GetAllAsync(onlinePaymentAccountSpec);

            if(!onlinePaymentAccounts.Any())
                return Enumerable.Empty<ClinicOnlinePaymentAccountResponseForOwner>();

            var response = onlinePaymentAccounts.Select(account => new ClinicOnlinePaymentAccountResponseForOwner()
            {
                Id = account.Id,
                Provider = account.Provider.ToString(),
                Status = account.Status.ToString(),
                IsReady = account.Status == OnlinePaymentAccountStatus.Ready,
                IsActive = account.IsActive,
                Integrations = account.PaymentIntegrations.Select(integration => new ClinicPaymentIntegrationResponse()
                {
                    Id = integration.Id,
                    PaymentMethod = integration.PaymentMethod.ToString(),
                    IntegrationId = integration.IntegrationId,
                    IsActive = integration.IsActive,
                }).ToList()
            });

            return response;
        }


        public async Task<string> DeletePaymentAccountAsync(string userId, int accountId, int clinicId)
        {
            var onlinePaymentAccountRepo = _unitOfWork.GetRepository<ClinicOnlinePaymentAccount, int>();
            var onlinePaymentAccountSpec = ClinicOnlinePaymentAccountSpecifications.ByIdWithPaymentsAndIntegrations(accountId);
            var existingOnlinePaymentAccount = await onlinePaymentAccountRepo.GetByIdAsync(onlinePaymentAccountSpec);
            if (existingOnlinePaymentAccount is null)
                throw new NotFoundException("The specified payment account was not found.");

            await GetDoctorOwnedClinicAccessAsync(userId, existingOnlinePaymentAccount.ClinicId);

            if (existingOnlinePaymentAccount.ClinicId != clinicId)
                throw new BadRequestException("The specified payment account does not belong to this clinic.");

            if (existingOnlinePaymentAccount.Payments.Any())
                throw new BadRequestException("This payment account cannot be deleted because it has existing payments. Please deactivate it instead.");

            var paymentIntegrationRepo = _unitOfWork.GetRepository<ClinicPaymentIntegration, int>();
            foreach (var integration in existingOnlinePaymentAccount.PaymentIntegrations)
            {
                paymentIntegrationRepo.Delete(integration);
            }

            onlinePaymentAccountRepo.Delete(existingOnlinePaymentAccount);

            int result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException("Failed to delete the Paymob account.");

            return "The Paymob account and its integrations were deleted successfully.";
        }


        public async Task<string> ActivatePaymentAccountAsync(string userId, int accountId, int clinicId)
        {
            var onlinePaymentAccountRepo = _unitOfWork.GetRepository<ClinicOnlinePaymentAccount, int>();
            var onlinePaymentAccountSpec = ClinicOnlinePaymentAccountSpecifications.ById(accountId);
            var existingOnlinePaymentAccount = await onlinePaymentAccountRepo.GetByIdAsync(onlinePaymentAccountSpec);

            if (existingOnlinePaymentAccount is null)
                throw new NotFoundException("The specified payment account was not found.");

            await GetDoctorOwnedClinicAccessAsync(userId, existingOnlinePaymentAccount.ClinicId);

            if (existingOnlinePaymentAccount.ClinicId != clinicId)
                throw new BadRequestException("The specified payment account does not belong to this clinic.");

            if (existingOnlinePaymentAccount.IsActive)
                return "The payment account is already active.";

            // Record the doctor's permission to use this account.
            // The account does NOT need to be Ready at this stage.
            existingOnlinePaymentAccount.IsActive = true;

            int result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException("Failed to activate the payment account.");

            return "The payment account has been activated successfully.";
        }


        public async Task<string> DeactivatePaymentAccountAsync(string userId, int accountId, int clinicId)
        {
            var onlinePaymentAccountRepo = _unitOfWork.GetRepository<ClinicOnlinePaymentAccount, int>();
            var onlinePaymentAccountSpec = ClinicOnlinePaymentAccountSpecifications.ByIdWithIntegrations(accountId);
            var existingOnlinePaymentAccount = await onlinePaymentAccountRepo.GetByIdAsync(onlinePaymentAccountSpec);

            if (existingOnlinePaymentAccount is null)
                throw new NotFoundException("The specified payment account was not found.");

            await GetDoctorOwnedClinicAccessAsync(userId, existingOnlinePaymentAccount.ClinicId);

            if (existingOnlinePaymentAccount.ClinicId != clinicId)
                throw new BadRequestException("The specified payment account does not belong to this clinic.");

            if (!existingOnlinePaymentAccount.IsActive)
                return "The payment account is already inactive.";

            var paymentIntegrationRepo = _unitOfWork.GetRepository<ClinicPaymentIntegration, int>();
            foreach (var integration in existingOnlinePaymentAccount.PaymentIntegrations)
            {
                integration.IsActive = false;
            }

            existingOnlinePaymentAccount.IsActive = false;

            int result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException("Failed to deactivate the payment account.");

            return "The payment account has been deactivated successfully.";
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
