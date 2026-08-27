using Microsoft.AspNetCore.Http;
using Shared.Dtos.Doctors;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.Doctors
{
    public interface IDoctorService
    {
        Task<DoctorProfileResponse> GetProfileAsync(string userId);
        Task<string> UpdateProfileAsync(string userId, UpdateDoctorProfileRequest request);
        Task<string> UpdateProfilePictureAsync(string userId, UpdateDoctorProfilePictureRequest request);
    }
}
