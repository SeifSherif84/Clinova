using Shared.Dtos.Auth;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.Auth
{
    public interface IAuthService
    {
        Task<DoctorRegistrationResponse> DoctorRegistrationAsync(DoctorRegistrationRequest request);
        Task<string> ConfirmEmailAsync(string? email, string? token);
        Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest request);
        Task<LoginResponse> LoginAsync(LoginRequest request);
        Task<string> ResetPaswordByEmailAsync(ResetPasswordByEmailRequest request);
        Task<string> UpdatePasswordAsync(string email, string token, UpdatePasswordRequest request);
        Task<string> ResendEmailConfirmationAsync(ResendEmailConfirmationRequest request);
        Task<string> LogoutAsync(string userId);
        Task<string> ChangePasswordAsync(string userId, ChangePasswordRequest request);
        Task<PatientRegistrationResponse> PatientRegistrationAsync(PatientRegistrationRequest request);
        Task<string> DeleteAccountAsync(string userId);
    }
}
