using AutoMapper;
using Domain.Contracts;
using Domain.Entities.BusinessEntities;
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
                throw new BadRequestException("Unable to identify the current user.");

            var doctorSpec = new DoctorSpecifications(userId);
            var doctor = await _unitOfWork.GetRepository<Doctor, string>().GetByIdAsync(doctorSpec);
            if (doctor is null)
                throw new NotFoundException("Doctor profile could not be found.");


            var doctorResponse = _mapper.Map<DoctorProfileResponse>(doctor);
            return doctorResponse;
        }


        public async Task<string> UpdateProfileAsync(string userId, UpdateDoctorProfileRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("Unable to identify the current user.");

            var doctorSpec = new DoctorSpecifications(userId);
            var doctor = await _unitOfWork.GetRepository<Doctor, string>().GetByIdAsync(doctorSpec);
            if (doctor is null)
                throw new NotFoundException("Doctor profile could not be found.");

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
                throw new BadRequestException("Unable to identify the current user.");

            var doctorSpec = new DoctorSpecifications(userId);
            var doctor = await _unitOfWork.GetRepository<Doctor, string>().GetByIdAsync(doctorSpec);
            if (doctor is null)
                throw new NotFoundException("Doctor profile could not be found.");

            if (request.ProfilePicture is not null)
            {
                if (doctor.ProfilePicture is not null)
                    FileStorageHandler.Delete(doctor.ProfilePicture, @"doctors\profilePictures");

                doctor.ProfilePicture = await FileStorageHandler.UploadAsync(request.ProfilePicture, @"doctors\profilePictures");
            }

            int result = await _unitOfWork.SaveChangesAsync();

            if (result == 0)
                return "Your profile picture is already up to date.";

            return "Your profile picture has been updated successfully.";
        }
    }
}
