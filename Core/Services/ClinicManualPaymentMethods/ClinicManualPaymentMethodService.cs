using AutoMapper;
using Domain.Contracts;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Domain.Exceptions.BadRequest;
using Domain.Exceptions.Forbidden;
using Domain.Exceptions.InternalServerError;
using Domain.Exceptions.NotFound;
using Services.Abstractions.ClinicManualPaymentMethods;
using Services.Commen;
using Services.Specifications.ClinicManualPaymentMethods;
using Shared.Dtos.ClinicManualPaymentMethods;
using Shared.Dtos.DoctorInvitations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.ClinicManualPaymentMethods
{
    public class ClinicManualPaymentMethodService(IUnitOfWork _unitOfWork, IMapper _mapper) : IClinicManualPaymentMethodService
    {
        public async Task<string> AddManualPaymentMethodAsync(string userId, int clinicId, AddClinicManualPaymentMethodRequest request)
        {
            await GetDoctorOwnedClinicAccessAsync(userId, clinicId);

            if (!Enum.IsDefined<ManualPaymentMethodType>(request.Type))
                throw new BadRequestException("Please choose a valid manual payment method type.");

            var manualPaymentMethodSpec = ClinicManualPaymentMethodSpecifications.ByClinicAndTypeAndAccountIdentifier(clinicId, request);
            var manualPaymentMethodRepo = _unitOfWork.GetRepository<ClinicManualPaymentMethod, int>();
            var existingPaymentMethod = await manualPaymentMethodRepo.GetByIdAsync(manualPaymentMethodSpec);
            if (existingPaymentMethod is not null)
                throw new BadRequestException("This payment method has already been added to the clinic.");

            var manualPaymentMethod = _mapper.Map<ClinicManualPaymentMethod>(request);
            manualPaymentMethod.ClinicId = clinicId;
            manualPaymentMethod.IsActive = true;

            await manualPaymentMethodRepo.AddAsync(manualPaymentMethod);

            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException("We couldn't add the payment method right now. Please try again later.");

            return "Your payment method has been added successfully.";
        }



        public async Task<string> UpdateManualPaymentMethodAsync(string userId, int clinicId,
                                                                       int paymentMethodId,
                                                                       UpdateClinicManualPaymentMethodRequest request)
        {
            await GetDoctorOwnedClinicAccessAsync(userId, clinicId);

            var manualPaymentMethodRepo = _unitOfWork.GetRepository<ClinicManualPaymentMethod, int>();
            var manualPaymentMethod = await manualPaymentMethodRepo.GetByIdAsync(paymentMethodId);

            if (manualPaymentMethod is null)
                throw new NotFoundException("The payment method you are trying to update does not exist.");

            if (manualPaymentMethod.ClinicId != clinicId)
                throw new ResourceAccessDeniedException("This payment method does not belong to this clinic.");


            var manualPaymentMethodSpec = ClinicManualPaymentMethodSpecifications.ByClinicAndTypeAndAccountIdentifier(clinicId, manualPaymentMethod.Type, request.AccountIdentifier);
            var existingPaymentMethod = await manualPaymentMethodRepo.GetByIdAsync(manualPaymentMethodSpec);
            if (existingPaymentMethod is not null)
                throw new BadRequestException("This payment method has already been added to the clinic.");


            manualPaymentMethod.AccountIdentifier = request.AccountIdentifier;
            var result = await _unitOfWork.SaveChangesAsync();

            if (result == 0)
                throw new InternalServerErrorException(
                    "We couldn't update the payment method right now. Please try again later.");

            return "Your payment method has been updated successfully.";
        }



        public async Task<IEnumerable<ClinicManualPaymentMethodResponseForPatient>> GetManualPaymentMethodsForPatientAsync(string userId, int clinicId)
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

            var paymentMethodRepo = _unitOfWork.GetRepository<ClinicManualPaymentMethod, int>();
            var specification = ClinicManualPaymentMethodSpecifications.ActiveByClinic(clinicId);
            var paymentMethods = await paymentMethodRepo.GetAllAsync(specification);
            if (!paymentMethods.Any())
                return Enumerable.Empty<ClinicManualPaymentMethodResponseForPatient>();

            return _mapper.Map<IEnumerable<ClinicManualPaymentMethodResponseForPatient>>(paymentMethods);
        }



        public async Task<IEnumerable<ClinicManualPaymentMethodResponseForOwner>> GetManualPaymentMethodsForOwnerAsync(string userId, int clinicId)
        {
            await GetDoctorOwnedClinicAccessAsync(userId, clinicId);

            var paymentMethodRepo = _unitOfWork.GetRepository<ClinicManualPaymentMethod, int>();
            var specification = ClinicManualPaymentMethodSpecifications.ByClinic(clinicId);
            var paymentMethods = await paymentMethodRepo.GetAllAsync(specification);
            if (!paymentMethods.Any())
                return Enumerable.Empty<ClinicManualPaymentMethodResponseForOwner>();

            return _mapper.Map<IEnumerable<ClinicManualPaymentMethodResponseForOwner>>(paymentMethods);
        }



        public async Task<string> ActivateManualPaymentMethodAsync(string userId, int clinicId, int paymentMethodId)
        {
            await GetDoctorOwnedClinicAccessAsync(userId, clinicId);

            var paymentMethodRepo = _unitOfWork.GetRepository<ClinicManualPaymentMethod, int>();
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



        public async Task<string> DeactivateManualPaymentMethodAsync(string userId, int clinicId, int paymentMethodId)
        {
            await GetDoctorOwnedClinicAccessAsync(userId, clinicId);

            var paymentMethodRepo = _unitOfWork.GetRepository<ClinicManualPaymentMethod, int>();
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



        public async Task<string> DeleteManualPaymentMethodAsync(string userId, int clinicId, int paymentMethodId)
        {
            await GetDoctorOwnedClinicAccessAsync(userId, clinicId);

            var paymentMethodRepo = _unitOfWork.GetRepository<ClinicManualPaymentMethod, int>();
            var specification = ClinicManualPaymentMethodSpecifications.ByIdWithPayments(paymentMethodId);
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
