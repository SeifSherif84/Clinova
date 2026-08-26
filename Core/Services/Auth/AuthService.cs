using AutoMapper;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Domain.Entities.Identity;
using Domain.Exceptions.AlreadyExist;
using Domain.Exceptions.BadRequest;
using Domain.Exceptions.Forbidden;
using Domain.Exceptions.InternalServerError;
using Domain.Exceptions.NotFound;
using Domain.Exceptions.Unauthorized;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Services.Abstractions.Auth;
using Services.FileStorage;
using Services.MailKitFeature;
using Shared.Dtos.Auth;
using Store.G02.Shared;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Numerics;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using System.Web;

namespace Services.Auth
{
    public class AuthService(UserManager<UserApp> _userManager,
                             IMapper _mapper,
                             IConfiguration _configuration,
                             IMailService _mailService,
                             IOptions<JWTOptions> _jwtOptions) : IAuthService
    {
        public async Task<DoctorRegistrationResponse> DoctorRegistrationAsync(DoctorRegistrationRequest doctorRegistrationRequest)
        {
            var user = await _userManager.FindByEmailAsync(doctorRegistrationRequest.Email);
            if (user is not null)
                throw new EmailAlreadyExistsException("An account with this email address already exists.");

            var doctor = _mapper.Map<Doctor>(doctorRegistrationRequest);

            doctor.NationalIdImageUrl = await FileStorageHandler.UploadAsync(doctorRegistrationRequest.NationalId, @"doctors\nationalIds");
            doctor.SyndicateCardImageUrl = await FileStorageHandler.UploadAsync(doctorRegistrationRequest.SyndicateCard, @"doctors\syndicateCards");

            var result = await _userManager.CreateAsync(doctor, doctorRegistrationRequest.Password);
            if (!result.Succeeded)
                throw new DoctorRegistrationException(result.Errors.Select(error => error.Description).ToList());

            var roleFlag = await _userManager.AddToRoleAsync(doctor, "Doctor");
            if (!roleFlag.Succeeded)
                throw new RoleAssignmentException(roleFlag.Errors.Select(error => error.Description).ToList());


            var sendEmailConfirmationflag = await SendEmailConfirmationURL(doctor);
            if (!sendEmailConfirmationflag)
                throw new EmailConfirmationSendException("Your account was created successfully, but We couldn't send the email confirmation right now. Please try again later.");

            return new DoctorRegistrationResponse()
            {
                Message = "Registration successful. Please check your email to confirm your account.",
                Email = doctorRegistrationRequest.Email,
                ApprovalStatus = doctor.ApprovalStatus
            };
        }



        private async Task<bool> SendEmailConfirmationURL(UserApp user)
        {
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var encodedToken = System.Web.HttpUtility.UrlEncode(token);
            var encodedEmail = HttpUtility.UrlEncode(user.Email);
            var callbackUrl = $"{_configuration["BaseURL"]}/{_configuration["EmailConfirmationURL"]}?email={encodedEmail}&token={encodedToken}";

            var email = new Email()
            {
                To = user.Email!,
                Subject = "Confirm Your Clinova Email Address",
                Body = $$"""
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">

                            <style>
                                * {
                                    margin: 0;
                                    padding: 0;
                                    box-sizing: border-box;
                                }

                                @keyframes fadeIn {
                                    from { opacity: 0; transform: translateY(12px); }
                                    to { opacity: 1; transform: translateY(0); }
                                }

                                @keyframes pulseGlow {
                                    0%, 100% {
                                        box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.45);
                                    }
                                    50% {
                                        box-shadow: 0 0 0 10px rgba(139, 92, 246, 0);
                                    }
                                }

                                @keyframes floatIcon {
                                    0%, 100% { transform: translateY(0); }
                                    50% { transform: translateY(-5px); }
                                }

                                @keyframes shimmerText {
                                    0% { background-position: -200% center; }
                                    100% { background-position: 200% center; }
                                }

                                body {
                                    font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
                                    background-color: #0a0b14;
                                    background-image:
                                        linear-gradient(160deg, #12142a 0%, #0a0b14 55%, #0d0a1c 100%);
                                    padding: 50px 20px;
                                }

                                .container {
                                    max-width: 600px;
                                    margin: 0 auto;
                                    background-color: #12131f;
                                    border-radius: 20px;
                                    padding: 46px 40px;
                                    border: 1px solid #23253a;
                                    animation: fadeIn 0.6s ease-out;
                                }

                                .header {
                                    text-align: center;
                                    margin-bottom: 32px;
                                }

                                .icon-badge {
                                    width: 64px;
                                    height: 64px;
                                    border-radius: 50%;
                                    background: linear-gradient(135deg, #6366f1, #a855f7);
                                    display: inline-flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 28px;
                                    margin-bottom: 16px;
                                    animation: floatIcon 3s ease-in-out infinite;
                                }

                                .header h2 {
                                    font-size: 25px;
                                    font-weight: 800;
                                    letter-spacing: 1.5px;
                                    color: #f1f0fb;
                                    text-transform: uppercase;
                                }

                                .header h2 span {
                                    background: linear-gradient(90deg, #a5b4fc, #f0abfc, #a5b4fc);
                                    background-size: 200% auto;
                                    -webkit-background-clip: text;
                                    -webkit-text-fill-color: transparent;
                                    background-clip: text;
                                    animation: shimmerText 3.5s linear infinite;
                                }

                                .subtitle {
                                    color: #64748b;
                                    font-size: 12.5px;
                                    letter-spacing: 2.5px;
                                    text-transform: uppercase;
                                    margin-top: 8px;
                                }

                                .content {
                                    color: #cbd5e1;
                                    font-size: 15.5px;
                                    line-height: 1.75;
                                }

                                .content p {
                                    margin-bottom: 16px;
                                }

                                .greeting {
                                    font-size: 19px;
                                    font-weight: 700;
                                    color: #f1f5f9;
                                    margin-bottom: 14px;
                                }

                                .btn-container {
                                    text-align: center;
                                    margin: 34px 0 26px;
                                }

                                .btn {
                                    display: inline-block;
                                    background: linear-gradient(135deg, #6366f1, #a855f7);
                                    color: #ffffff !important;
                                    text-decoration: none;
                                    font-weight: 700;
                                    font-size: 15px;
                                    letter-spacing: 0.5px;
                                    padding: 15px 44px;
                                    border-radius: 12px;
                                    animation: pulseGlow 2.4s infinite;
                                    text-transform: uppercase;
                                }

                                .note {
                                    background-color: #191a2a;
                                    padding: 16px 20px;
                                    border-radius: 12px;
                                    border: 1px solid #262841;
                                    border-left: 3px solid #a855f7;
                                    font-size: 13.5px;
                                    color: #94a3b8;
                                    margin-top: 24px;
                                }

                                .divider-line {
                                    height: 1px;
                                    background-color: #23253a;
                                    margin: 34px 0 22px;
                                }

                                .footer {
                                    text-align: center;
                                    font-size: 13px;
                                    color: #64748b;
                                }

                                .footer strong {
                                    color: #c4b5fd;
                                }
                            </style>
                        </head>

                        <body>

                            <div class="container">

                                <div class="header">
                                    <h2>CLI<span>NOVA</span></h2>
                                    <div class="subtitle">Email Verification</div>
                                </div>

                                <div class="content">

                                    <p class="greeting">
                                        Welcome aboard 🚀
                                    </p>

                                    <p>
                                        Thank you for registering with us.
                                        We're excited to have you as part of the Clinova community!
                                    </p>

                                    <p>
                                        Please confirm your email address by clicking
                                        the button below to activate your account:
                                    </p>

                                    <div class="btn-container">
                                        <a href="{{callbackUrl}}" class="btn">
                                            Confirm My Email
                                        </a>
                                    </div>

                                    <div class="note">
                                        🔒 If you did not create this account,
                                        you can safely ignore this email — no further action is needed.
                                    </div>

                                </div>

                                <div class="divider-line"></div>

                                <div class="footer">
                                    Best regards,<br>
                                    <strong>Clinova Team</strong>
                                </div>

                            </div>

                        </body>
                        </html>
                        """,
                IsHtml = true
            };

            var result = _mailService.SendMail(email);
            return result;
        }



        public async Task<string> ConfirmEmailAsync(string? email, string? token)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(token))
                throw new BadRequestException("Invalid or missing email confirmation information.");

            var user = await _userManager.FindByEmailAsync(email);
            if (user is null)
                throw new NotFoundException("User associated with the email address was not found.");

            var result = await _userManager.ConfirmEmailAsync(user, token);
            if (!result.Succeeded)
                throw new InvalidEmailConfirmationException(result.Errors.Select(error => error.Description).ToList());

            return "Your email address has been successfully confirmed. Welcome to Clinova!";
        }



        public async Task<LoginResponse> LoginAsync(LoginRequest loginRequest)
        {
            var user = await _userManager.FindByEmailAsync(loginRequest.Email);
            if (user is null)
                throw new FailedLoginException("Invalid email or password.");

            var flag = await _userManager.CheckPasswordAsync(user, loginRequest.Password);
            if (!flag)
                throw new FailedLoginException("Invalid email or password.");

            if (!await _userManager.IsEmailConfirmedAsync(user))
                throw new UnconfirmedEmailException("Please confirm your email address before logging in.");

            if (await _userManager.IsInRoleAsync(user, "Doctor"))
            {
                Doctor doctor = (Doctor)user;
                if (doctor.ApprovalStatus == DoctorApprovalStatus.Pending)
                    throw new AccountPendingException(
                        "Your account is pending administrator approval.");

                if (doctor.ApprovalStatus == DoctorApprovalStatus.Rejected)
                    throw new AccountRejectedException(
                        "Your account has been rejected by the administrator.");
            }

            var jwtToken = await GenerateJwtToken(user);
            user.RefreshToken = GenerateRefreshToken();
            user.RefreshTokenExpirationDate = DateTime.UtcNow.AddDays(14);

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                throw new UserUpdateException(result.Errors.Select(error => error.Description).ToList());

            return new LoginResponse()
            {
                Message = "Login successful.",
                AccessToken = jwtToken,
                RefreshToken = user.RefreshToken
            };
        }



        public async Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest refreshTokenRequest)
        {
            if (string.IsNullOrEmpty(refreshTokenRequest.RefreshToken))
                throw new RequiredRefreshTokenException("Refresh token is required.");

            var user = await _userManager.Users.FirstOrDefaultAsync(user => user.RefreshToken == refreshTokenRequest.RefreshToken);
            if (user is null || user.RefreshTokenExpirationDate <= DateTime.UtcNow)
                throw new InvalidRefreshTokenException("Invalid or expired refresh token.");

            user.RefreshToken = GenerateRefreshToken();
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                throw new UserUpdateException(result.Errors.Select(error => error.Description).ToList());

            var jwtToken = await GenerateJwtToken(user);

            return new LoginResponse()
            {
                Message = "Token refreshed successfully.",
                AccessToken = jwtToken,
                RefreshToken = user.RefreshToken
            };
        }



        private async Task<string> GenerateJwtToken(UserApp user)
        {
            var userClaims = new List<Claim>()
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email!),
                new Claim(ClaimTypes.GivenName, $"{user.FirstName} {user.LastName}"),
            };

            var userRoles = await _userManager.GetRolesAsync(user);

            foreach (var role in userRoles)
            {
                userClaims.Add(new Claim(ClaimTypes.Role, role));
            }

            var jwtOptions = _jwtOptions.Value;
            var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SecurityKey));

            var jwtToken = new JwtSecurityToken(
                issuer: jwtOptions.Issuer,
                audience: jwtOptions.Audience,
                claims: userClaims,
                expires: DateTime.UtcNow.AddMinutes(jwtOptions.ExpiredDurationInMinute),
                signingCredentials: new SigningCredentials(secretKey, SecurityAlgorithms.HmacSha256)
            );

            return new JwtSecurityTokenHandler().WriteToken(jwtToken);
        }



        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }



        public async Task<string> ResetPaswordByEmailAsync(ResetPasswordByEmail resetPasswordByEmail)
        {
            var user = await _userManager.FindByEmailAsync(resetPasswordByEmail.Email);
            if (user == null)
                throw new NotFoundException("No account was found with the provided email address.");
            if (!user.EmailConfirmed)
                throw new UnconfirmedEmailException("Please confirm your email address before resetting your password.");

            var sendResetPasswordflag = await SendResetPasswordURL(user);
            if (!sendResetPasswordflag)
                throw new ResetPasswordEmailSendException("We couldn't send the password reset email right now. Please try again later.");

            return "A password reset link has been sent to your email address. Please check your inbox to continue.";
        }



        private async Task<bool> SendResetPasswordURL(UserApp user)
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var encodedToken = System.Web.HttpUtility.UrlEncode(token);
            var encodedEmail = HttpUtility.UrlEncode(user.Email);
            var callbackUrl = $"{_configuration["BaseURL"]}/{_configuration["ResetPasswordURL"]}?email={encodedEmail}&token={encodedToken}";

            var email = new Email()
            {
                To = user.Email!,
                Subject = "Reset Your Clinova Password",
                Body = $$"""
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">

                            <style>
                                * {
                                    margin: 0;
                                    padding: 0;
                                    box-sizing: border-box;
                                }

                                @keyframes fadeIn {
                                    from { opacity: 0; transform: translateY(12px); }
                                    to { opacity: 1; transform: translateY(0); }
                                }

                                @keyframes pulseGlow {
                                    0%, 100% {
                                        box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.45);
                                    }
                                    50% {
                                        box-shadow: 0 0 0 10px rgba(139, 92, 246, 0);
                                    }
                                }

                                @keyframes floatIcon {
                                    0%, 100% { transform: translateY(0); }
                                    50% { transform: translateY(-5px); }
                                }

                                @keyframes shimmerText {
                                    0% { background-position: -200% center; }
                                    100% { background-position: 200% center; }
                                }

                                body {
                                    font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
                                    background-color: #0a0b14;
                                    background-image:
                                        linear-gradient(160deg, #12142a 0%, #0a0b14 55%, #0d0a1c 100%);
                                    padding: 50px 20px;
                                }

                                .container {
                                    max-width: 600px;
                                    margin: 0 auto;
                                    background-color: #12131f;
                                    border-radius: 20px;
                                    padding: 46px 40px;
                                    border: 1px solid #23253a;
                                    animation: fadeIn 0.6s ease-out;
                                }

                                .header {
                                    text-align: center;
                                    margin-bottom: 32px;
                                }

                                .icon-badge {
                                    width: 64px;
                                    height: 64px;
                                    border-radius: 50%;
                                    background: linear-gradient(135deg, #6366f1, #a855f7);
                                    display: inline-flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 28px;
                                    margin-bottom: 16px;
                                    animation: floatIcon 3s ease-in-out infinite;
                                }

                                .header h2 {
                                    font-size: 25px;
                                    font-weight: 800;
                                    letter-spacing: 1.5px;
                                    color: #f1f0fb;
                                    text-transform: uppercase;
                                }

                                .header h2 span {
                                    background: linear-gradient(90deg, #a5b4fc, #f0abfc, #a5b4fc);
                                    background-size: 200% auto;
                                    -webkit-background-clip: text;
                                    -webkit-text-fill-color: transparent;
                                    background-clip: text;
                                    animation: shimmerText 3.5s linear infinite;
                                }

                                .subtitle {
                                    color: #64748b;
                                    font-size: 12.5px;
                                    letter-spacing: 2.5px;
                                    text-transform: uppercase;
                                    margin-top: 8px;
                                }

                                .content {
                                    color: #cbd5e1;
                                    font-size: 15.5px;
                                    line-height: 1.75;
                                }

                                .content p {
                                    margin-bottom: 16px;
                                }

                                .greeting {
                                    font-size: 19px;
                                    font-weight: 700;
                                    color: #f1f5f9;
                                    margin-bottom: 14px;
                                }

                                .btn-container {
                                    text-align: center;
                                    margin: 34px 0 26px;
                                }

                                .btn {
                                    display: inline-block;
                                    background: linear-gradient(135deg, #6366f1, #a855f7);
                                    color: #ffffff !important;
                                    text-decoration: none;
                                    font-weight: 700;
                                    font-size: 15px;
                                    letter-spacing: 0.5px;
                                    padding: 15px 44px;
                                    border-radius: 12px;
                                    animation: pulseGlow 2.4s infinite;
                                    text-transform: uppercase;
                                }

                                .note {
                                    background-color: #191a2a;
                                    padding: 16px 20px;
                                    border-radius: 12px;
                                    border: 1px solid #262841;
                                    border-left: 3px solid #a855f7;
                                    font-size: 13.5px;
                                    color: #94a3b8;
                                    margin-top: 24px;
                                }

                                .divider-line {
                                    height: 1px;
                                    background-color: #23253a;
                                    margin: 34px 0 22px;
                                }

                                .footer {
                                    text-align: center;
                                    font-size: 13px;
                                    color: #64748b;
                                }

                                .footer strong {
                                    color: #c4b5fd;
                                }
                            </style>
                        </head>

                        <body>

                            <div class="container">

                                <div class="header">
                                    <h2>CLI<span>NOVA</span></h2>
                                    <div class="subtitle">Password Reset</div>
                                </div>

                                <div class="content">

                                    <p class="greeting">
                                        Forgot your password? 🔐
                                    </p>

                                    <p>
                                        We received a request to reset the password
                                        for your Clinova account.
                                    </p>

                                    <p>
                                        If you made this request, click the button below
                                        to create a new password and regain access to your account:
                                    </p>

                                    <div class="btn-container">
                                        <a href="{{callbackUrl}}" class="btn">
                                            Reset My Password
                                        </a>
                                    </div>

                                    <div class="note">
                                        🔒 If you did not request a password reset,
                                        you can safely ignore this email — your account and password will remain unchanged.
                                    </div>

                                </div>

                                <div class="divider-line"></div>

                                <div class="footer">
                                    Best regards,<br>
                                    <strong>Clinova Team</strong>
                                </div>

                            </div>

                        </body>
                        </html>
                        """,
                IsHtml = true
            };

            var result = _mailService.SendMail(email);
            return result;
        }



        public async Task<string> UpdatePasswordAsync(string email, string token, UpdatePasswordRequest updatePasswordRequest)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(token))
                throw new BadRequestException("Invalid or missing reset password information.");

            var user = await _userManager.FindByEmailAsync(email);
            if (user is null)
                throw new NotFoundException("User associated with the email address was not found.");

            var result = await _userManager.ResetPasswordAsync(user, token, updatePasswordRequest.NewPassword);
            if (!result.Succeeded)
                throw new InvalidResetPasswordException(result.Errors.Select(error => error.Description).ToList());

            return "Your password has been successfully reset. You can now sign in with your new password.";
        }



        public async Task<string> ResendEmailConfirmationAsync(ResendEmailConfirmationRequest resendEmailConfirmationRequest)
        {
            if (string.IsNullOrWhiteSpace(resendEmailConfirmationRequest.Email))
                throw new BadRequestException("Email address is required.");

            var user = await _userManager.FindByEmailAsync(resendEmailConfirmationRequest.Email);
            if (user is null)
                throw new NotFoundException("User associated with the email address was not found.");

            if (user.EmailConfirmed)
                return "Your email address has already been confirmed.";

            var sendEmailConfirmationflag = await SendEmailConfirmationURL(user);
            if (!sendEmailConfirmationflag)
                throw new EmailConfirmationSendException("we couldn't send the email confirmation right now. Please try again later.");

            return "A new email confirmation link has been sent to your email address.";
        }



        public async Task<string> LogoutAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("Unable to identify the current user.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user is null)
                throw new NotFoundException("The current user could not be found.");

            user.RefreshToken = null;
            user.RefreshTokenExpirationDate = null;
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                throw new UserUpdateException(
                    result.Errors.Select(error => error.Description).ToList());

            return "You have been successfully logged out.";
        }



        public async Task<string> ChangePasswordAsync(string userId, ChangePasswordRequest changePasswordRequest)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("Unable to identify the current user.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user is null)
                throw new NotFoundException("The current user could not be found.");

            var result = await _userManager.ChangePasswordAsync(user, changePasswordRequest.CurrentPassword, changePasswordRequest.NewPassword);
            if (!result.Succeeded)
                throw new InvalidPasswordChangeException(
                    result.Errors.Select(error => error.Description).ToList());

            return "Your password has been changed successfully.";
        }



        public async Task<PatientRegistrationResponse> PatientRegistrationAsync(PatientRegistrationRequest patientRegistrationRequest)
        {
            var user = await _userManager.FindByEmailAsync(patientRegistrationRequest.Email);
            if (user is not null)
                throw new EmailAlreadyExistsException("An account with this email address already exists.");

            var patient = _mapper.Map<Patient>(patientRegistrationRequest);
            var result = await _userManager.CreateAsync(patient, patientRegistrationRequest.Password);
            if (!result.Succeeded)
                throw new PatientRegistrationException(result.Errors.Select(error => error.Description).ToList());

            var roleFlag = await _userManager.AddToRoleAsync(patient, "Patient");
            if (!roleFlag.Succeeded)
                throw new RoleAssignmentException(roleFlag.Errors.Select(error => error.Description).ToList());

            var sendEmailConfirmationflag = await SendEmailConfirmationURL(patient);
            if (!sendEmailConfirmationflag)
                throw new EmailConfirmationSendException("Your account was created successfully, but We couldn't send the email confirmation right now. Please try again later.");

            return new PatientRegistrationResponse()
            {
                Message = "Registration successful. Please check your email to confirm your account.",
                Email = patientRegistrationRequest.Email,
            };
        }



        public async Task<string> DeleteAccountAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("Unable to identify the current user.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user is null || user.IsDeleted)
                throw new NotFoundException("User not found or already deleted.");

            user.IsDeleted = true;
            user.DeletedAt = DateTime.UtcNow;
            user.RefreshToken = null;
            user.RefreshTokenExpirationDate = null;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                throw new UserUpdateException(
                    result.Errors.Select(error => error.Description).ToList());

            return "Your account has been successfully deleted.";
        }
    }
}
