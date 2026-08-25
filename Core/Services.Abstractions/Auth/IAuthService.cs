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
        Task ConfirmEmailAsync(string? email, string? token);
        Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest refreshTokenRequest);
        Task<LoginResponse> LoginAsync(LoginRequest loginRequest);

    }
}
