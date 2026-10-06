using Shared.Dtos.Patients;
using Shared.Dtos.Secretaries;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.Secretaries
{
    public interface ISecretaryService
    {
        Task<SecretaryProfileResponse> GetProfileAsync(string userId);
        Task<string> UpdateProfileAsync(string userId, UpdateSecretaryProfileRequest request);
        Task<string> UpdateProfilePictureAsync(string userId, UpdateSecretaryProfilePictureRequest request);
    }
}
