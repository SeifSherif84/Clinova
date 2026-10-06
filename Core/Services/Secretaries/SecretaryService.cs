using AutoMapper;
using Domain.Contracts;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Domain.Exceptions.BadRequest;
using Domain.Exceptions.InternalServerError;
using Domain.Exceptions.NotFound;
using Services.Abstractions.Secretaries;
using Services.FileStorage;
using Shared.Dtos.Patients;
using Shared.Dtos.Secretaries;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Secretaries
{
    public class SecretaryService(IUnitOfWork _unitOfWork, IMapper _mapper) : ISecretaryService
    {
        public async Task<SecretaryProfileResponse> GetProfileAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var secretary = await _unitOfWork.GetRepository<Secretary, string>().GetByIdAsync(userId);
            if (secretary is null)
                throw new NotFoundException("We couldn't find your account.");

            return _mapper.Map<SecretaryProfileResponse>(secretary);
        }


        public async Task<string> UpdateProfileAsync(string userId, UpdateSecretaryProfileRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var secretary = await _unitOfWork.GetRepository<Secretary, string>().GetByIdAsync(userId);
            if (secretary is null)
                throw new NotFoundException("We couldn't find your account.");

            if (request.DateOfBirth is not null && request.DateOfBirth > DateOnly.FromDateTime(DateTime.UtcNow))
                throw new BadRequestException("Date of birth cannot be in the future.");

            if (request.Gender is not null && !Enum.IsDefined(typeof(Gender), request.Gender))
                throw new BadRequestException("Invalid gender.");

            if (request.FirstName is not null && string.IsNullOrWhiteSpace(request.FirstName))
                throw new BadRequestException("First name cannot be empty.");

            if (request.LastName is not null && string.IsNullOrWhiteSpace(request.LastName))
                throw new BadRequestException("Last name cannot be empty.");

            if (request.FirstName is not null)
                request.FirstName = request.FirstName.Trim();

            if (request.LastName is not null)
                request.LastName = request.LastName.Trim();

            _mapper.Map(request, secretary);
            int result = await _unitOfWork.SaveChangesAsync();

            if (result == 0)
                return "Your profile is already up to date.";

            return "Your profile has been updated successfully.";
        }


        public async Task<string> UpdateProfilePictureAsync(string userId, UpdateSecretaryProfilePictureRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var secretary = await _unitOfWork.GetRepository<Secretary, string>().GetByIdAsync(userId);
            if (secretary is null)
                throw new NotFoundException("We couldn't find your account.");

            var oldProfilePicture = secretary.ProfilePicture;

            secretary.ProfilePicture = await FileStorageHandler.UploadAsync(request.ProfilePicture, @"secretaries\profilePictures");

            int result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException(
                    "An error occurred while updating your profile picture. Please try again later.");

            if (oldProfilePicture is not null)
                FileStorageHandler.Delete(oldProfilePicture, @"secretaries\profilePictures");

            return "Your profile picture has been updated successfully.";
        }
    }
}
