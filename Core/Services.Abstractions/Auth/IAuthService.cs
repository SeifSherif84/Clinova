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
        Task<DoctorRegistrationResponse> DoctorRegistrationAsync(DoctorRegistrationRequest doctorRegistrationRequest);
        Task<string> ConfirmEmailAsync(string? email, string? token);
        Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest refreshTokenRequest);
        Task<LoginResponse> LoginAsync(LoginRequest loginRequest);
        Task<string> ResetPaswordByEmailAsync(ResetPasswordByEmail resetPasswordByEmail);
        Task<string> UpdatePasswordAsync(string email, string token, UpdatePasswordRequest updatePasswordRequest);
        Task<string> ResendEmailConfirmationAsync(ResendEmailConfirmationRequest resendEmailConfirmationRequest);
        Task<string> LogoutAsync(string userId);
        Task<string> ChangePasswordAsync(string userId, ChangePasswordRequest changePasswordRequest);
        Task<PatientRegistrationResponse> PatientRegistrationAsync(PatientRegistrationRequest patientRegistrationRequest);
        Task<string> DeleteAccountAsync(string userId);
    }
}
