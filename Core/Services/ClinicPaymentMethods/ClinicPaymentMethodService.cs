using AutoMapper;
using Domain.Contracts;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Domain.Exceptions.BadRequest;
using Domain.Exceptions.Forbidden;
using Domain.Exceptions.InternalServerError;
using Domain.Exceptions.NotFound;
using Services.Abstractions.ClinicPaymentMethods;
using Services.Commen;
using Services.Specifications.ClinicPaymentMethods;
using Shared.Dtos.ClinicPaymentMethods;
using Shared.Dtos.Invitations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.ClinicPaymentMethods
{
    internal class ClinicPaymentMethodService(IUnitOfWork _unitOfWork, IMapper _mapper) : IClinicPaymentMethodService
    {
        public async Task<string> AddClinicPaymentMethodAsync(string userId, int clinicId, AddClinicPaymentMethodRequest request)
        {
            await GetDoctorOwnedClinicAccessAsync(userId, clinicId);

            ValidatePaymentMethodRequest(request);

            var paymentMethodSpec = ClinicPaymentMethodSpecifications.ByClinicAndPaymentDetails(clinicId, request);
            var paymentMethodRepo = _unitOfWork.GetRepository<ClinicPaymentMethod, int>();
            var existingPaymentMethod = await paymentMethodRepo.GetByIdAsync(paymentMethodSpec);
            if (existingPaymentMethod is not null)
                throw new BadRequestException("This payment method has already been added to the clinic.");

            var paymentMethod = _mapper.Map<ClinicPaymentMethod>(request);
            paymentMethod.ClinicId = clinicId;
            paymentMethod.IsActive = true;

            await paymentMethodRepo.AddAsync(paymentMethod);

            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException("We couldn't add the payment method right now. Please try again later.");

            return "Your payment method has been added successfully.";
        }


        private static void ValidatePaymentMethodRequest(AddClinicPaymentMethodRequest request)
        {
            if (!Enum.IsDefined<PaymentMethodType>(request.Type))
                throw new BadRequestException("Please choose a valid payment method type.");

            switch (request.Type)
            {
                case PaymentMethodType.OnlineGateway:

                    if (string.IsNullOrWhiteSpace(request.Provider))
                        throw new BadRequestException(
                            "Provider is required for online gateway payments.");

                    if (string.IsNullOrWhiteSpace(request.ProviderAccountId))
                        throw new BadRequestException(
                            "Provider account ID is required for online gateway payments.");

                    if (!string.IsNullOrWhiteSpace(request.AccountIdentifier))
                        throw new BadRequestException(
                            "Account identifier is not allowed for online gateway payments.");
                    break;

                case PaymentMethodType.VodafoneCash:
                case PaymentMethodType.InstaPay:

                    if (string.IsNullOrWhiteSpace(request.AccountIdentifier))
                        throw new BadRequestException(
                            "An account identifier is required for this payment method.");

                    if (!string.IsNullOrWhiteSpace(request.Provider))
                        throw new BadRequestException(
                            "Provider is not allowed for this payment method.");

                    if (!string.IsNullOrWhiteSpace(request.ProviderAccountId))
                        throw new BadRequestException(
                            "Provider account ID is not allowed for this payment method.");
                    break;

                default:
                    throw new BadRequestException("Please choose a valid payment method type.");
            }
        }



        public async Task<string> UpdateClinicPaymentMethodAsync(string userId, int clinicId,
                                                                 int paymentMethodId,
                                                                 UpdateClinicPaymentMethodRequest request)
        {
            await GetDoctorOwnedClinicAccessAsync(userId, clinicId);

            var paymentMethodRepo = _unitOfWork.GetRepository<ClinicPaymentMethod, int>();
            var paymentMethod = await paymentMethodRepo.GetByIdAsync(paymentMethodId);

            if (paymentMethod is null)
                throw new NotFoundException(
                    "The payment method you are trying to update does not exist.");

            if (paymentMethod.ClinicId != clinicId)
                throw new ResourceAccessDeniedException(
                    "This payment method does not belong to this clinic.");

            ValidatePaymentMethodUpdateRequest(paymentMethod.Type, request);

            // Manual Update
            switch (paymentMethod.Type)
            {
                case PaymentMethodType.VodafoneCash:
                case PaymentMethodType.InstaPay:
                    paymentMethod.AccountIdentifier = request.AccountIdentifier;
                    break;

                case PaymentMethodType.OnlineGateway:
                    paymentMethod.Provider = request.Provider;
                    paymentMethod.ProviderAccountId = request.ProviderAccountId;
                    break;

                default:
                    throw new BadRequestException("The payment method type is not supported.");
            }

            var result = await _unitOfWork.SaveChangesAsync();

            if (result == 0)
                throw new InternalServerErrorException(
                    "We couldn't update the payment method right now. Please try again later.");

            return "Your payment method has been updated successfully.";
        }


        private static void ValidatePaymentMethodUpdateRequest(PaymentMethodType type,
                                                               UpdateClinicPaymentMethodRequest request)
        {
            switch (type)
            {
                case PaymentMethodType.VodafoneCash:
                case PaymentMethodType.InstaPay:

                    if (string.IsNullOrWhiteSpace(request.AccountIdentifier))
                        throw new BadRequestException(
                            "An account identifier is required for this payment method.");

                    if (!string.IsNullOrWhiteSpace(request.Provider))
                        throw new BadRequestException(
                            "Provider is not allowed for this payment method.");

                    if (!string.IsNullOrWhiteSpace(request.ProviderAccountId))
                        throw new BadRequestException(
                            "Provider account ID is not allowed for this payment method.");
                    break;

                case PaymentMethodType.OnlineGateway:

                    if (string.IsNullOrWhiteSpace(request.Provider))
                        throw new BadRequestException(
                            "Provider is required for online gateway payments.");

                    if (string.IsNullOrWhiteSpace(request.ProviderAccountId))
                        throw new BadRequestException(
                            "Provider account ID is required for online gateway payments.");

                    if (!string.IsNullOrWhiteSpace(request.AccountIdentifier))
                        throw new BadRequestException(
                            "Account identifier is not allowed for online gateway payments.");
                    break;

                default:
                    throw new BadRequestException("Please choose a valid payment method type.");
            }
        }



        public async Task<IEnumerable<ClinicPaymentMethodResponseForPatient>> GetClinicPaymentMethodsForPatientAsync(string userId, int clinicId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var patient = await _unitOfWork.GetRepository<Patient, string>().GetByIdAsync(userId);
            if (patient is null)
                throw new NotFoundException("We couldn't find your account.");

            var clinicRepo = _unitOfWork.GetRepository<Clinic, int>();
            var clinic = await clinicRepo.GetByIdAsync(clinicId);
            if (clinic is null)
                throw new NotFoundException("The clinic you are trying to access does not exist.");

            var paymentMethodRepo = _unitOfWork.GetRepository<ClinicPaymentMethod, int>();
            var specification = ClinicPaymentMethodSpecifications.ActiveByClinic(clinicId);
            var paymentMethods = await paymentMethodRepo.GetAllAsync(specification);
            if (!paymentMethods.Any())
                return Enumerable.Empty<ClinicPaymentMethodResponseForPatient>();

            return _mapper.Map<IEnumerable<ClinicPaymentMethodResponseForPatient>>(paymentMethods);
        }



        public async Task<IEnumerable<ClinicPaymentMethodResponseForOwner>> GetClinicPaymentMethodsForOwnerAsync(string userId, int clinicId)
        {
            await GetDoctorOwnedClinicAccessAsync(userId, clinicId);

            var paymentMethodRepo = _unitOfWork.GetRepository<ClinicPaymentMethod, int>();
            var specification = ClinicPaymentMethodSpecifications.ByClinic(clinicId);
            var paymentMethods = await paymentMethodRepo.GetAllAsync(specification);
            if (!paymentMethods.Any())
                return Enumerable.Empty<ClinicPaymentMethodResponseForOwner>();

            return _mapper.Map<IEnumerable<ClinicPaymentMethodResponseForOwner>>(paymentMethods);
        }



        public async Task<string> ActivateClinicPaymentMethodAsync(string userId, int clinicId, int paymentMethodId)
        {
            await GetDoctorOwnedClinicAccessAsync(userId, clinicId);

            var paymentMethodRepo = _unitOfWork.GetRepository<ClinicPaymentMethod, int>();
            var paymentMethod = await paymentMethodRepo.GetByIdAsync(paymentMethodId);

            if (paymentMethod is null)
                throw new NotFoundException(
                    "The payment method you are trying to activate does not exist.");

            if (paymentMethod.ClinicId != clinicId)
                throw new ResourceAccessDeniedException(
                    "This payment method does not belong to this clinic.");

            if (paymentMethod.IsActive)
                throw new BadRequestException(
                    "This payment method is already active.");

            paymentMethod.IsActive = true;

            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
            {
                throw new InternalServerErrorException(
                    "We couldn't activate the payment method right now. Please try again later.");
            }

            return "The payment method has been activated successfully.";
        }



        public async Task<string> DeactivateClinicPaymentMethodAsync(string userId, int clinicId, int paymentMethodId)
        {
            await GetDoctorOwnedClinicAccessAsync(userId, clinicId);

            var paymentMethodRepo = _unitOfWork.GetRepository<ClinicPaymentMethod, int>();
            var paymentMethod = await paymentMethodRepo.GetByIdAsync(paymentMethodId);

            if (paymentMethod is null)
                throw new NotFoundException(
                    "The payment method you are trying to deactivate does not exist.");

            if (paymentMethod.ClinicId != clinicId)
                throw new ResourceAccessDeniedException(
                    "This payment method does not belong to this clinic.");

            if (!paymentMethod.IsActive)
                throw new BadRequestException(
                    "This payment method is already inactive.");

            paymentMethod.IsActive = false;

            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
            {
                throw new InternalServerErrorException(
                    "We couldn't deactivate the payment method right now. Please try again later.");
            }

            return "The payment method has been deactivated successfully.";
        }



        public async Task<string> DeleteClinicPaymentMethodAsync(string userId, int clinicId, int paymentMethodId)
        {
            await GetDoctorOwnedClinicAccessAsync(userId, clinicId);

            var paymentMethodRepo = _unitOfWork.GetRepository<ClinicPaymentMethod, int>();
            var specification = ClinicPaymentMethodSpecifications.ByIdWithPayments(paymentMethodId);
            var paymentMethod = await paymentMethodRepo.GetByIdAsync(specification);

            if (paymentMethod is null)
                throw new NotFoundException(
                    "The payment method you are trying to delete does not exist.");

            if (paymentMethod.ClinicId != clinicId)
                throw new ResourceAccessDeniedException(
                    "This payment method does not belong to this clinic.");

            if (paymentMethod.Payments.Any())
            {
                throw new BadRequestException(
                    "This payment method cannot be deleted because it has existing payments. Please deactivate it instead.");
            }

            paymentMethodRepo.Delete(paymentMethod);

            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
            {
                throw new InternalServerErrorException(
                    "We couldn't delete the payment method right now. Please try again later.");
            }

            return "The payment method has been deleted successfully.";
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
