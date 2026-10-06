using AutoMapper;
using Domain.Contracts;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Domain.Exceptions.BadRequest;
using Domain.Exceptions.InternalServerError;
using Domain.Exceptions.NotFound;
using Services.Abstractions.Patients;
using Services.FileStorage;
using Services.Specifications.Doctors;
using Shared.Dtos.Patients;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Patients
{
    public class PatientService(IUnitOfWork _unitOfWork, IMapper _mapper) : IPatientService
    {
        public async Task<PatientProfileResponse> GetProfileAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var patient = await _unitOfWork.GetRepository<Patient, string>().GetByIdAsync(userId);
            if (patient is null)
                throw new NotFoundException("We couldn't find your account.");

            return _mapper.Map<PatientProfileResponse>(patient);
        }


        public async Task<string> UpdateProfileAsync(string userId, UpdatePatientProfileRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var patient = await _unitOfWork.GetRepository<Patient, string>().GetByIdAsync(userId);
            if (patient is null)
                throw new NotFoundException("We couldn't find your account.");

            if (request.DateOfBirth is not null && request.DateOfBirth > DateOnly.FromDateTime(DateTime.Now))
                throw new BadRequestException("Date of birth cannot be in the future.");

            if (request.BloodType is not null && !Enum.IsDefined(typeof(BloodTypes), request.BloodType))
                throw new BadRequestException("Invalid blood type.");

            if (request.Gender is not null && !Enum.IsDefined(typeof(Gender), request.Gender))
                throw new BadRequestException("Invalid gender.");

            if (request.FirstName is not null && string.IsNullOrWhiteSpace(request.FirstName))
                throw new BadRequestException("First name cannot be empty.");

            if (request.LastName is not null && string.IsNullOrWhiteSpace(request.LastName))
                throw new BadRequestException("First name cannot be empty.");

            if (request.FirstName is not null)
                request.FirstName = request.FirstName.Trim();

            if (request.LastName is not null)
                request.LastName = request.LastName.Trim();

            _mapper.Map(request, patient);
            int result = await _unitOfWork.SaveChangesAsync();

            if (result == 0)
                return "Your profile is already up to date.";

            return "Your profile has been updated successfully.";
        }


        public async Task<string> UpdateProfilePictureAsync(string userId, UpdatePatientProfilePictureRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var patient = await _unitOfWork.GetRepository<Patient, string>().GetByIdAsync(userId);
            if (patient is null)
                throw new NotFoundException("We couldn't find your account.");

            var oldProfilePicture = patient.ProfilePicture;

            patient.ProfilePicture = await FileStorageHandler.UploadAsync(request.ProfilePicture, @"patients\profilePictures");

            int result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException(
                    "An error occurred while updating your profile picture. Please try again later.");

            if (oldProfilePicture is not null)
                FileStorageHandler.Delete(oldProfilePicture, @"patients\profilePictures");

            return "Your profile picture has been updated successfully.";
        }

    }
}
