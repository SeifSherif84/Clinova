using Domain.Contracts;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Domain.Exceptions.BadRequest;
using Domain.Exceptions.Forbidden;
using Domain.Exceptions.InternalServerError;
using Domain.Exceptions.NotFound;
using Services.Abstractions.ClinicPaymentIntegrations;
using Services.Commen;
using Services.Specifications.ClinicOnlinePaymentAccounts;
using Services.Specifications.ClinicPaymentIntegrations;
using Shared.Dtos.ClinicPaymentIntegrations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.ClinicPaymentIntegrations
{
    internal class ClinicPaymentIntegrationService(IUnitOfWork _unitOfWork) : IClinicPaymentIntegrationService
    {
        public async Task<string> AddPaymentIntegrationForPaymobAccountAsync(string userId, int accountId, int clinicId, AddClinicPaymentIntegrationRequest request)
        {
            await GetDoctorOwnedClinicAccessAsync(userId, clinicId);

            var onlinePaymentAccountRepo = _unitOfWork.GetRepository<ClinicOnlinePaymentAccount, int>();
            var existingOnlinePaymentAccount = await onlinePaymentAccountRepo.GetByIdAsync(accountId);

            if (existingOnlinePaymentAccount is null)
                throw new NotFoundException("The specified online payment account was not found.");

            if (existingOnlinePaymentAccount.ClinicId != clinicId)
                throw new BadRequestException("The specified online payment account does not belong to this clinic.");

            if (existingOnlinePaymentAccount.Status == OnlinePaymentAccountStatus.Disabled)
                throw new BadRequestException("This Paymob account is disabled.");

            if (existingOnlinePaymentAccount.Provider != OnlinePaymentProvider.Paymob)
                throw new BadRequestException("The specified account is not a Paymob account.");

            var paymentIntegrationRepo = _unitOfWork.GetRepository<ClinicPaymentIntegration, int>();
            var existingIntegrationSpec = ClinicPaymentIntegrationSpecifications.ByAccountAndPaymentMethod(existingOnlinePaymentAccount.Id, request.PaymentMethod);
            var existingIntegration = await paymentIntegrationRepo.GetByIdAsync(existingIntegrationSpec);

            if (existingIntegration is not null)
                throw new BadRequestException($"A {request.PaymentMethod} payment integration is already configured for this clinic.");

            var paymentIntegration = new ClinicPaymentIntegration
            {
                PaymentMethod = request.PaymentMethod,
                IntegrationId = request.IntegrationId,
                IsActive = true,
                ClinicOnlinePaymentAccount = existingOnlinePaymentAccount
            };

            await paymentIntegrationRepo.AddAsync(paymentIntegration);

            int result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException("Failed to add the Paymob payment integration.");

            return $"A {request.PaymentMethod} payment integration is configured for this Paymob account.";
        }

        public async Task<string> UpdatePaymentIntegrationAsync(string userId, int integrationId, int accountId, int clinicId, UpdateClinicPaymentIntegrationRequest request)
        {
            var paymentIntegrationRepo = _unitOfWork.GetRepository<ClinicPaymentIntegration, int>();
            var paymentIntegrationSpec = ClinicPaymentIntegrationSpecifications.ByIdWithAccount(integrationId);
            var existingIntegration = await paymentIntegrationRepo.GetByIdAsync(paymentIntegrationSpec);
            if (existingIntegration is null)
                throw new NotFoundException("The specified payment integration was not found.");

            await GetDoctorOwnedClinicAccessAsync(userId, existingIntegration.ClinicOnlinePaymentAccount.ClinicId);

            if (existingIntegration.ClinicOnlinePaymentAccountId != accountId)
                throw new BadRequestException("The specified payment integration does not belong to the specified online payment account.");

            if (existingIntegration.ClinicOnlinePaymentAccount is null)
                throw new InternalServerErrorException("The specified payment integration is not associated with any online payment account.");

            if (existingIntegration.ClinicOnlinePaymentAccount.ClinicId != clinicId)
                throw new BadRequestException("The specified payment integration does not belong to this clinic.");

            if (existingIntegration.IntegrationId == request.IntegrationId)
                return $"The {existingIntegration.PaymentMethod} payment integration is already configured with the this integration ID.";

            existingIntegration.IntegrationId = request.IntegrationId;
            if(existingIntegration.ClinicOnlinePaymentAccount.Status != OnlinePaymentAccountStatus.PendingVerification)
                existingIntegration.ClinicOnlinePaymentAccount.Status = OnlinePaymentAccountStatus.PendingVerification;


            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException("Failed to update the Paymob payment integration.");

            return $"The {existingIntegration.PaymentMethod} payment integration has been updated successfully.";
        }

        public async Task<string> DeletePaymentIntegrationAsync(string userId, int integrationId, int accountId, int clinicId)
        {
            var paymentIntegrationRepo = _unitOfWork.GetRepository<ClinicPaymentIntegration, int>();
            var paymentIntegrationSpec = ClinicPaymentIntegrationSpecifications.ByIdWithAccount(integrationId);
            var existingIntegration = await paymentIntegrationRepo.GetByIdAsync(paymentIntegrationSpec);
            if (existingIntegration is null)
                throw new NotFoundException("The specified payment integration was not found.");

            await GetDoctorOwnedClinicAccessAsync(userId, existingIntegration.ClinicOnlinePaymentAccount.ClinicId);

            if (existingIntegration.ClinicOnlinePaymentAccountId != accountId)
                throw new BadRequestException("The specified payment integration does not belong to the specified online payment account.");

            if (existingIntegration.ClinicOnlinePaymentAccount is null)
                throw new InternalServerErrorException("The specified payment integration is not associated with any online payment account.");

            if (existingIntegration.ClinicOnlinePaymentAccount.ClinicId != clinicId)
                throw new BadRequestException("The specified payment integration does not belong to this clinic.");

            paymentIntegrationRepo.Delete(existingIntegration);
            int result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException("Failed to delete the Paymob payment integration.");

            return $"The {existingIntegration.PaymentMethod} payment integration has been deleted successfully.";
        }

        public async Task<string> ActivatePaymentIntegrationAsync(string userId, int integrationId, int accountId, int clinicId)
        {
            var paymentIntegrationRepo = _unitOfWork.GetRepository<ClinicPaymentIntegration, int>();
            var paymentIntegrationSpec = ClinicPaymentIntegrationSpecifications.ByIdWithAccount(integrationId);
            var existingIntegration = await paymentIntegrationRepo.GetByIdAsync(paymentIntegrationSpec);
            if (existingIntegration is null)
                throw new NotFoundException("The specified payment integration was not found.");

            await GetDoctorOwnedClinicAccessAsync(userId, existingIntegration.ClinicOnlinePaymentAccount.ClinicId);

            if (existingIntegration.ClinicOnlinePaymentAccountId != accountId)
                throw new BadRequestException("The specified payment integration does not belong to the specified online payment account.");

            if (existingIntegration.ClinicOnlinePaymentAccount is null)
                throw new InternalServerErrorException("The specified payment integration is not associated with any online payment account.");

            if (existingIntegration.ClinicOnlinePaymentAccount.ClinicId != clinicId)
                throw new BadRequestException("The specified payment integration does not belong to this clinic.");

            if (existingIntegration.IsActive)
                return "The specified payment integration is already active.";

            if (!existingIntegration.ClinicOnlinePaymentAccount.IsActive)
                throw new BadRequestException("The associated online payment account is not active. Please activate the online payment account first.");

            existingIntegration.IsActive = true;
            int result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException("Failed to activate the Paymob payment integration.");

            return $"The {existingIntegration.PaymentMethod} payment integration has been activated successfully.";
        }

        public async Task<string> DeactivatePaymentIntegrationAsync(string userId, int integrationId, int accountId, int clinicId)
        {
            var paymentIntegrationRepo = _unitOfWork.GetRepository<ClinicPaymentIntegration, int>();
            var paymentIntegrationSpec = ClinicPaymentIntegrationSpecifications.ByIdWithAccount(integrationId);
            var existingIntegration = await paymentIntegrationRepo.GetByIdAsync(paymentIntegrationSpec);
            if (existingIntegration is null)
                throw new NotFoundException("The specified payment integration was not found.");

            await GetDoctorOwnedClinicAccessAsync(userId, existingIntegration.ClinicOnlinePaymentAccount.ClinicId);

            if (existingIntegration.ClinicOnlinePaymentAccountId != accountId)
                throw new BadRequestException("The specified payment integration does not belong to the specified online payment account.");

            if (existingIntegration.ClinicOnlinePaymentAccount is null)
                throw new InternalServerErrorException("The specified payment integration is not associated with any online payment account.");

            if (existingIntegration.ClinicOnlinePaymentAccount.ClinicId != clinicId)
                throw new BadRequestException("The specified payment integration does not belong to this clinic.");

            if (!existingIntegration.IsActive)
                return "The specified payment integration is already inactive.";

            existingIntegration.IsActive = false;
            int result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException("Failed to deactivate the Paymob payment integration.");

            return $"The {existingIntegration.PaymentMethod} payment integration has been deactivated successfully.";
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
