using AutoMapper;
using Domain.Contracts;
using Domain.Entities;
using Domain.Entities.BusinessEntities;
using Domain.Exceptions.BadRequest;
using Domain.Exceptions.Forbidden;
using Domain.Exceptions.InternalServerError;
using Domain.Exceptions.NotFound;
using Services.Clinics;
using Services.FileStorage;
using Services.Specifications.Clinics;
using Services.Specifications.Doctors;
using Shared.Dtos.Clinics;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static System.Net.Mime.MediaTypeNames;

namespace Services.Abstractions.Clinics
{
    public class ClinicService(IUnitOfWork _unitOfWork, IMapper _mapper) : IClinicService
    {
        public async Task<string> AddClinicAsync(string userId, AddClinicRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var doctor = await _unitOfWork.GetRepository<Doctor, string>().GetByIdAsync(userId);
            if (doctor is null)
                throw new NotFoundException("We couldn't find your account.");


            var clinic = _mapper.Map<Clinic>(request);

            var doctorClinic = new DoctorClinic
            {
                Doctor = doctor,
                Clinic = clinic,
                IsOwner = true
            };

            foreach (var image in request.Images)
            {
                clinic.Images.Add(new ClinicImages
                {
                    Image = await FileStorageHandler.UploadAsync(image, "clinics")
                });
            }

            foreach (var phone in request.PhoneNumbers)
            {
                clinic.PhoneNumbers.Add(new ClinicPhoneNumbers
                {
                    PhoneNumber = phone
                });
            }

            await _unitOfWork.GetRepository<Clinic, int>().AddAsync(clinic);
            await _unitOfWork.GetRepository<DoctorClinic>().AddAsync(doctorClinic);
            int result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException("We couldn't add your clinic right now. Please try again.");

            return "Your clinic has been added successfully.";
        }



        public async Task<string> UpdateClinicAsync(string userId, int clinicId, UpdateClinicRequest request)
        {
            var doctorClinicOwnedAccess = await GetDoctorOwnedClinicAccessAsync(userId, clinicId);

            _mapper.Map(request, doctorClinicOwnedAccess.Clinic);

            if(request.RegionId.HasValue)
                doctorClinicOwnedAccess.Clinic.RegionId = request.RegionId.Value;

            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                return "Your clinic is already up to date.";

            return "Your clinic has been updated successfully.";
        }



        public async Task<string> DeleteClinicAsync(string userId, int clinicId)
        {
            var doctorClinicOwnedAccess = await GetDoctorOwnedClinicAccessAsync(userId, clinicId);

            if (doctorClinicOwnedAccess.Clinic.IsDeleted)
                return "The clinic is already deleted.";

            doctorClinicOwnedAccess.Clinic.IsDeleted = true;
            doctorClinicOwnedAccess.Clinic.DeletedAt = DateTime.UtcNow;

            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException(
                    "We couldn't delete the clinic right now. Please try again.");

            return "The clinic has been deleted successfully.";
        }



        public async Task<string> AddImageAsync(string userId, int clinicId, AddClinicImagesRequest request)
        {
            var doctorClinicOwnedAccess = await GetDoctorOwnedClinicAccessAsync(userId, clinicId, includeClinicImages: true);

            if (doctorClinicOwnedAccess.Clinic.Images.Count + request.Images.Count > 6)
                throw new BadRequestException("You can have up to 6 images for your clinic.");


            foreach (var image in request.Images)
            {
                doctorClinicOwnedAccess.Clinic.Images.Add(new ClinicImages()
                {
                    Image = await FileStorageHandler.UploadAsync(image, "clinics")
                });
            }

            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException(
                    "We couldn't add the clinic images right now. Please try again.");

            return "Your clinic images have been added successfully.";
        }



        public async Task<string> AddPhoneNumberAsync(string userId, int clinicId, AddClinicPhoneNumberRequest request)
        {
            var doctorClinicOwnedAccess = await GetDoctorOwnedClinicAccessAsync(userId, clinicId, includeClinicPhoneNumbers: true);

            if (doctorClinicOwnedAccess.Clinic.PhoneNumbers.Count >= 6)
                throw new BadRequestException("You can have up to 6 phone numbers for your clinic.");


            doctorClinicOwnedAccess.Clinic.PhoneNumbers.Add(new ClinicPhoneNumbers()
            {
                PhoneNumber = request.PhoneNumber,
            });


            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException(
                    "We couldn't add the phone number right now. Please try again.");

            return "Your phone number has been added successfully.";
        }



        public async Task<string> DeleteImageAsync(string userId, int clinicId, int imageId)
        {
            await GetDoctorOwnedClinicAccessAsync(userId, clinicId);

            var clinicImagesRepo = _unitOfWork.GetRepository<ClinicImages, int>();

            var clinicImage = await clinicImagesRepo.GetByIdAsync(imageId);
            if (clinicImage is null || clinicImage.ClinicId != clinicId)
                throw new NotFoundException(
                    "The image you're trying to delete could not be found in this clinic.");

            FileStorageHandler.Delete(clinicImage.Image, "clinics");
            clinicImagesRepo.Delete(clinicImage);
            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException(
                    "We couldn't delete the clinic image right now. Please try again.");

            return "The clinic image has been deleted successfully.";
        }



        public async Task<string> DeletePhoneNumberAsync(string userId, int clinicId, int phoneNumberId)
        {
            await GetDoctorOwnedClinicAccessAsync(userId, clinicId);

            var clinicPhoneNumbersRepo = _unitOfWork.GetRepository<ClinicPhoneNumbers, int>();

            var clinicPhoneNumber = await clinicPhoneNumbersRepo.GetByIdAsync(phoneNumberId);
            if (clinicPhoneNumber is null || clinicPhoneNumber.ClinicId != clinicId)
                throw new NotFoundException(
                    "The phone number you're trying to delete could not be found in this clinic.");

            clinicPhoneNumbersRepo.Delete(clinicPhoneNumber);
            var result = await _unitOfWork.SaveChangesAsync();

            if (result == 0)
                throw new InternalServerErrorException(
                    "We couldn't delete the phone number right now. Please try again.");

            return "The phone number has been deleted successfully.";
        }



        public async Task<IEnumerable<ClinicResponse>> GetAllClinicAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var doctor = await _unitOfWork.GetRepository<Doctor, string>().GetByIdAsync(userId);
            if (doctor is null)
                throw new NotFoundException("We couldn't find your account.");


            var clinicSpec = new ClinicSpecifications(userId, includeRegion: true);
            var clinics = await _unitOfWork.GetRepository<Clinic, int>().GetAllAsync(clinicSpec);
            if (!clinics.Any())
                return Enumerable.Empty<ClinicResponse>();

            return _mapper.Map<IEnumerable<ClinicResponse>>(clinics);
        }



        public async Task<ClinicDetailsResponse> GetClinicDetailsAsync(string userId, int clinicId)
        {
            var doctorClinicAccess = await GetDoctorClinicAccessAsync(userId, clinicId, true, true, true);
            var clinicDetailsResponse = _mapper.Map<ClinicDetailsResponse>(doctorClinicAccess.Clinic);
            return clinicDetailsResponse;
        }



        private async Task<DoctorClinicContext> GetDoctorClinicAccessAsync(string userId,
                                                                           int clinicId,
                                                                           bool includeClinicImages = false,
                                                                           bool includeClinicPhoneNumbers = false,
                                                                           bool includeClinicRegion = false)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");


            var doctor = await _unitOfWork.GetRepository<Doctor, string>().GetByIdAsync(userId);
            if (doctor is null)
                throw new NotFoundException("We couldn't find your account.");


            var clinicSpec = new ClinicSpecifications(clinicId, includeClinicImages, includeClinicPhoneNumbers, includeClinicRegion);
            var clinic = await _unitOfWork.GetRepository<Clinic, int>().GetByIdAsync(clinicSpec);
            if (clinic is null)
                throw new NotFoundException("The clinic you're trying to access could not be found.");


            var doctorClinic = await _unitOfWork.GetRepository<DoctorClinic>().GetByCompositeKeyAsync(doctor.Id, clinic.Id);
            if (doctorClinic is null)
                throw new ResourceAccessDeniedException("You don't have access to this clinic.");


            return new DoctorClinicContext
            {
                Doctor = doctor,
                Clinic = clinic,
                IsOwner = doctorClinic.IsOwner
            };
        }



        private async Task<DoctorClinicContext> GetDoctorOwnedClinicAccessAsync( string userId,
                                                                                 int clinicId,
                                                                                 bool includeClinicImages = false,
                                                                                 bool includeClinicPhoneNumbers = false,
                                                                                 bool includeClinicRegion = false)
        {
            var doctorClinicAccess = await GetDoctorClinicAccessAsync(userId,
                                                                      clinicId,
                                                                      includeClinicImages,
                                                                      includeClinicPhoneNumbers,
                                                                      includeClinicRegion);

            if (!doctorClinicAccess.IsOwner)
                throw new ResourceAccessDeniedException("Only the clinic owner can perform this action.");

            return doctorClinicAccess;
        }


    }
}
