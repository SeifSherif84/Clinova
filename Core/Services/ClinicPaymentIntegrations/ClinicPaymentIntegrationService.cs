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

            if (!Enum.IsDefined<OnlinePaymentMethod>(request.PaymentMethod))
                throw new BadRequestException("Invalid online payment method.");


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

            return $"A {request.PaymentMethod} payment integration is already configured for this Paymob account.";
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
