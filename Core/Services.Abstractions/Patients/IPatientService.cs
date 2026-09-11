using Shared.Dtos.Patients;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.Patients
{
    public interface IPatientService
    {
        Task<PatientProfileResponse> GetProfileAsync(string userId);
        Task<string> UpdateProfileAsync(string userId, UpdatePatientProfileRequest request);
        Task<string> UpdateProfilePictureAsync(string userId, UpdatePatientProfilePictureRequest request);
    }
}
