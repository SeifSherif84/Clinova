using AutoMapper;
using Domain.Contracts;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Domain.Entities.Identity;
using Domain.Exceptions.BadRequest;
using Domain.Exceptions.InternalServerError;
using Domain.Exceptions.NotFound;
using Microsoft.AspNetCore.Identity;
using Services.Abstractions.Doctors;
using Services.FileStorage;
using Services.Specifications.Doctors;
using Shared.Dtos.Doctors;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Doctors
{
    public class DoctorService(IUnitOfWork _unitOfWork,
                               IMapper _mapper) : IDoctorService
    {
        public async Task<DoctorProfileResponse> GetProfileAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var doctorSpec = new DoctorSpecifications(userId);
            var doctor = await _unitOfWork.GetRepository<Doctor, string>().GetByIdAsync(doctorSpec);
            if (doctor is null)
                throw new NotFoundException("We couldn't find your account.");

            var doctorResponse = _mapper.Map<DoctorProfileResponse>(doctor);
            return doctorResponse;
        }



        public async Task<string> UpdateProfileAsync(string userId, UpdateDoctorProfileRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var doctor = await _unitOfWork.GetRepository<Doctor, string>().GetByIdAsync(userId);
            if (doctor is null)
                throw new NotFoundException("We couldn't find your account.");

            if (request.DateOfBirth is not null && request.DateOfBirth > DateOnly.FromDateTime(DateTime.Now))
                throw new BadRequestException("Date of birth cannot be in the future.");

            if (request.Gender is not null && !Enum.IsDefined(typeof(Gender), request.Gender))
                throw new BadRequestException("Invalid gender.");

            if (request.Title is not null && string.IsNullOrWhiteSpace(request.Title))
                throw new BadRequestException("Title cannot be empty.");

            if (request.Bio is not null && string.IsNullOrWhiteSpace(request.Bio))
                throw new BadRequestException("Bio cannot be empty.");

            if (request.Title is not null)
                request.Title = request.Title.Trim();

            if (request.Bio is not null)
                request.Bio = request.Bio.Trim();

            _mapper.Map(request, doctor);
            int result = await _unitOfWork.SaveChangesAsync(); // If saving the changes fails due to a database or server-side error,
                                                               // SaveChangesAsync will throw an exception, which will be caught and handled
                                                               // by the Global Error Handling Middleware.
            if (result == 0)
                return "Your profile is already up to date.";

            return "Your profile has been updated successfully.";
        }



        public async Task<string> UpdateProfilePictureAsync(string userId, UpdateDoctorProfilePictureRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var doctorSpec = new DoctorSpecifications(userId);
            var doctor = await _unitOfWork.GetRepository<Doctor, string>().GetByIdAsync(doctorSpec);
            if (doctor is null)
                throw new NotFoundException("We couldn't find your account.");

            var oldProfilePicture = doctor.ProfilePicture;

            doctor.ProfilePicture = await FileStorageHandler.UploadAsync(request.ProfilePicture, @"doctors\profilePictures");

            int result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException(
                    "An error occurred while updating your profile picture. Please try again later.");

            if (oldProfilePicture is not null)
                FileStorageHandler.Delete(oldProfilePicture, @"doctors\profilePictures");

            return "Your profile picture has been updated successfully.";
        }
    }
}
