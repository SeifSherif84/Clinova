using AutoMapper;
using Domain.Contracts;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Domain.Entities.Identity;
using Domain.Exceptions.BadRequest;
using Domain.Exceptions.Forbidden;
using Domain.Exceptions.InternalServerError;
using Domain.Exceptions.NotFound;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Services.Abstractions.Auth;
using Services.Abstractions.Notifications;
using Services.Abstractions.SecretaryInvitations;
using Services.Commen;
using Services.DoctorInvitations;
using Services.MailKitFeature;
using Services.Specifications.DoctorInvitations;
using Services.Specifications.SecretaryInvitations;
using Shared.Dtos.DoctorInvitations;
using Shared.Dtos.SecretaryInvitations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;

namespace Services.SecretaryInvitations
{
    public class SecretaryInvitationService(IUnitOfWork _unitOfWork,
                                            UserManager<UserApp> _userManager,
                                            IConfiguration _configuration,
                                            IMailService _mailService,
                                            INotificationService _notificationService,
                                            IMapper _mapper) : ISecretaryInvitationService
    {
        public async Task<string> SendSecretaryInvitationAsync(string userId, int clinicId, SendSecretaryInvitationRequest request)
        {
            var doctorClinicAccess = await GetDoctorOwnedClinicAccessAsync(userId, clinicId);

            var user = await _userManager.FindByEmailAsync(request.Email);

            if (user is not null)
            {
                // The email belongs to an existing account.
                // It must be a Secretary account.

                //var secretary = await _unitOfWork.GetRepository<Secretary, string>().GetByIdAsync(user.Id);
                //if (secretary is null)
                //    throw new NotFoundException("The user you are trying to invite is not a secretary.");

                if (!await _userManager.IsInRoleAsync(user, "Secretary"))
                    throw new BadRequestException("The provided email address does not belong to a secretary account.");

                var secretary = (Secretary)user;

                if (secretary.ClinicId == clinicId)
                    throw new BadRequestException("This secretary is already working in this clinic.");

                if (secretary.ClinicId.HasValue && secretary.ClinicId != clinicId)
                    throw new BadRequestException("This secretary is already assigned to another clinic.");


                var secretaryInvitationRepo = _unitOfWork.GetRepository<SecretaryInvitation, int>();
                var secretaryInvitationSpec = SecretaryInvitationSpecifications.PendingSecretaryInvitationById(secretary.Id, clinicId);
                var existingInvitation = await secretaryInvitationRepo.GetByIdAsync(secretaryInvitationSpec);
                if (existingInvitation is not null)
                    throw new BadRequestException("An invitation has already been sent to this secretary and is still pending.");


                var secretaryInvitation = new SecretaryInvitation
                {
                    SecretaryReceiverId = secretary.Id,
                    SecretaryReceiverEmail = secretary.Email!,
                    DoctorSenderId = doctorClinicAccess.Doctor.Id,
                    ClinicId = doctorClinicAccess.Clinic.Id,
                    Status = InvitationStatus.Pending,
                    SentAt = DateTime.UtcNow
                };

                await secretaryInvitationRepo.AddAsync(secretaryInvitation);
                int result = await _unitOfWork.SaveChangesAsync();
                if (result == 0)
                    throw new InternalServerErrorException("We couldn't send the invitation right now. Please try again later.");

                await _notificationService.CreateAndSendAsync(
                    secretary.Id,
                    "New Secretary Invitation",
                    $"Dr. {doctorClinicAccess.Doctor.FirstName} {doctorClinicAccess.Doctor.LastName} has invited you to join {doctorClinicAccess.Clinic.Name} as a secretary.",
                    NotificationType.InvitationReceived);

                return "Secretary invitation has been sent successfully.";
            }



            else
            {
                // No account exists with this email.
                // Store the email in the invitation and send an invitation email.

                var secretaryInvitationRepo = _unitOfWork.GetRepository<SecretaryInvitation, int>();
                var secretaryInvitationSpec = SecretaryInvitationSpecifications.PendingSecretaryInvitationByEmail(request.Email, clinicId);
                var existingInvitation = await secretaryInvitationRepo.GetByIdAsync(secretaryInvitationSpec);
                if (existingInvitation is not null)
                    throw new BadRequestException("An invitation has already been sent to this email address and is still pending.");


                var secretaryInvitation = new SecretaryInvitation
                {
                    SecretaryReceiverId = null,
                    SecretaryReceiverEmail = request.Email,
                    DoctorSenderId = doctorClinicAccess.Doctor.Id,
                    ClinicId = doctorClinicAccess.Clinic.Id,
                    Status = InvitationStatus.Pending,
                    SentAt = DateTime.UtcNow
                };

                await _unitOfWork.GetRepository<SecretaryInvitation, int>().AddAsync(secretaryInvitation);

                int result = await _unitOfWork.SaveChangesAsync();
                if (result == 0)
                    throw new InternalServerErrorException("We couldn't send the invitation right now. Please try again later.");

                var emailSent = SendSecretaryInvitationEmail(request.Email,
                                                             $"{doctorClinicAccess.Doctor.FirstName} {doctorClinicAccess.Doctor.LastName}", 
                                                             doctorClinicAccess.Clinic.Name);

                if (!emailSent)
                    throw new InternalServerErrorException(
                        "The invitation was created successfully, but we couldn't send the invitation email right now. Please try again later.");

                return "Secretary invitation has been sent successfully. An invitation email has been sent to the provided email address.";
            }

        }


        private bool SendSecretaryInvitationEmail(string email, string doctorName, string clinicName)
        {
            var frontendBaseUrl = /*_configuration["FrontendBaseURL"] ?? */_configuration["BaseURL"];

            var invitationUrl = $"{frontendBaseUrl}/{_configuration["SecretaryRegistrationPage"]}";

            var mail = new Email
            {
                To = email,
                Subject = "You Have Been Invited to Join a Clinic on Clinova",
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

                                .highlight {
                                    color: #c4b5fd;
                                    font-weight: 700;
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
                                    <div class="subtitle">Clinic Invitation</div>
                                </div>

                                <div class="content">

                                    <p class="greeting">
                                        You're invited to join Clinova 🎉
                                    </p>

                                    <p>
                                        Dr. <span class="highlight">{{doctorName}}</span>
                                        has invited you to join
                                        <span class="highlight">{{clinicName}}</span>
                                        as a secretary.
                                    </p>

                                    <p>
                                        If you don't have a Clinova account yet,
                                        create one using this email address first.
                                        After registration and email confirmation,
                                        you'll be able to view and accept your invitation.
                                    </p>

                                    <div class="btn-container">
                                        <a href="{{invitationUrl}}" class="btn">
                                            Join Clinova
                                        </a>
                                    </div>

                                    <div class="note">
                                        🔒 If you did not expect this invitation,
                                        you can safely ignore this email.
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

            return _mailService.SendMail(mail);
        }




        public async Task<IEnumerable<SentSecretaryInvitationResponse>> GetSentSecretaryInvitationsAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var doctor = await _unitOfWork.GetRepository<Doctor, string>().GetByIdAsync(userId);
            if (doctor is null)
                throw new NotFoundException("We couldn't find your account.");


            var secretaryInvitationSpec = SecretaryInvitationSpecifications.SentSecretaryInvitationByDoctorId(doctor.Id);
            var secretaryInvitations = await _unitOfWork.GetRepository<SecretaryInvitation, int>().GetAllAsync(secretaryInvitationSpec);
            if (!secretaryInvitations.Any())
                return Enumerable.Empty<SentSecretaryInvitationResponse>();

            return _mapper.Map<List<SentSecretaryInvitationResponse>>(secretaryInvitations);
        }


        public async Task<IEnumerable<ReceivedSecretaryInvitationResponse>> GetReceivedSecretaryInvitationsAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");


            var secretary = await _unitOfWork.GetRepository<Secretary, string>().GetByIdAsync(userId);
            if (secretary is null)
                throw new NotFoundException("We couldn't find your account.");


            var secretaryInvitationSpec = SecretaryInvitationSpecifications.ReceivedSecretaryInvitationBySecretaryId(secretary.Id);
            var secretaryInvitations = await _unitOfWork.GetRepository<SecretaryInvitation, int>().GetAllAsync(secretaryInvitationSpec);
            if (!secretaryInvitations.Any())
                return Enumerable.Empty<ReceivedSecretaryInvitationResponse>();

            return _mapper.Map<List<ReceivedSecretaryInvitationResponse>>(secretaryInvitations);
        }




        public async Task<string> AcceptSecretaryInvitationAsync(string userId, int secretaryInvitationId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");


            var secretary = await _unitOfWork.GetRepository<Secretary, string>().GetByIdAsync(userId);
            if (secretary is null)
                throw new NotFoundException("We couldn't find your account.");

            var secretaryInvitationSpec = SecretaryInvitationSpecifications.SecretaryInvitationById(secretaryInvitationId);
            var secretaryInvitation = await _unitOfWork.GetRepository<SecretaryInvitation, int>().GetByIdAsync(secretaryInvitationSpec);

            if (secretaryInvitation is null)
                throw new NotFoundException("The invitation you are trying to accept does not exist.");

            if (secretaryInvitation.SecretaryReceiverId != userId)
                throw new ResourceAccessDeniedException("You don't have access to this invitation.");

            if (secretaryInvitation.Status is not InvitationStatus.Pending)
                throw new BadRequestException("This invitation is no longer pending.");

            if (secretary.ClinicId == secretaryInvitation.ClinicId)
                throw new BadRequestException("You are already assigned to this clinic.");

            if (secretary.ClinicId is not null && secretary.ClinicId != secretaryInvitation.ClinicId)
                throw new BadRequestException("You are already assigned to a clinic. You must leave your current clinic before accepting another invitation.");


            secretaryInvitation.Status = InvitationStatus.Accepted;
            secretaryInvitation.RespondedAt = DateTime.UtcNow;
            secretary.ClinicId = secretaryInvitation.ClinicId;

            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException("you couldn't accept the invitation right now. Please try again later.");


            await _notificationService.CreateAndSendAsync(
                secretaryInvitation.DoctorSenderId,
                "Invitation Accepted",
                $"{secretary.FirstName} {secretary.LastName} accepted your invitation to join {secretaryInvitation.Clinic.Name}.",
                NotificationType.InvitationAccepted);


            return "You have successfully joined the clinic as a secretary.";
        }



        public async Task<string> RejectSecretaryInvitationAsync(string userId, int secretaryInvitationId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");


            var secretary = await _unitOfWork.GetRepository<Secretary, string>().GetByIdAsync(userId);
            if (secretary is null)
                throw new NotFoundException("We couldn't find your account.");

            var secretaryInvitationSpec = SecretaryInvitationSpecifications.SecretaryInvitationById(secretaryInvitationId);
            var secretaryInvitation = await _unitOfWork.GetRepository<SecretaryInvitation, int>().GetByIdAsync(secretaryInvitationSpec);

            if (secretaryInvitation is null)
                throw new NotFoundException("The invitation you are trying to reject does not exist.");

            if (secretaryInvitation.SecretaryReceiverId != userId)
                throw new ResourceAccessDeniedException("You don't have access to this invitation.");

            if (secretaryInvitation.Status is not InvitationStatus.Pending)
                throw new BadRequestException("This invitation is no longer pending.");


            secretaryInvitation.Status = InvitationStatus.Rejected;
            secretaryInvitation.RespondedAt = DateTime.UtcNow;

            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException("you couldn't reject the invitation right now. Please try again later.");


            await _notificationService.CreateAndSendAsync(
                secretaryInvitation.DoctorSenderId,
                "Invitation Rejected",
                $"{secretary.FirstName} {secretary.LastName} rejected your invitation to join {secretaryInvitation.Clinic.Name}.",
                NotificationType.InvitationRejected);


            return "You have successfully rejected the invitation.";
        }



        public async Task<string> CancelSecretaryInvitationAsync(string userId, int secretaryInvitationId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var doctor = await _unitOfWork.GetRepository<Doctor, string>().GetByIdAsync(userId);
            if (doctor is null)
                throw new NotFoundException("We couldn't find your account.");

            var secretaryInvitationSpec = SecretaryInvitationSpecifications.SecretaryInvitationById(secretaryInvitationId);
            var secretaryInvitation = await _unitOfWork.GetRepository<SecretaryInvitation, int>().GetByIdAsync(secretaryInvitationSpec);

            if (secretaryInvitation is null)
                throw new NotFoundException("The invitation you are trying to cancel does not exist.");

            if (secretaryInvitation.DoctorSenderId != userId)
                throw new ResourceAccessDeniedException("You don't have access to this invitation.");

            if (secretaryInvitation.Status is not InvitationStatus.Pending)
                throw new BadRequestException("This invitation is no longer pending.");

            _unitOfWork.GetRepository<SecretaryInvitation, int>().Delete(secretaryInvitation);
            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException("You couldn't cancel the invitation right now. Please try again later.");


            if (secretaryInvitation.SecretaryReceiverId is not null)
            {
                await _notificationService.CreateAndSendAsync(
                    secretaryInvitation.SecretaryReceiverId,
                    "Invitation Canceled",
                    $"Dr. {doctor.FirstName} {doctor.LastName} canceled the invitation to join {secretaryInvitation.Clinic.Name}.",
                    NotificationType.InvitationCancelled);
            }

            return "You have successfully canceled the invitation.";
        }





        private async Task<DoctorClinicContext> GetDoctorOwnedClinicAccessAsync(string userId, int clinicId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");


            var doctor = await _unitOfWork.GetRepository<Doctor, string>().GetByIdAsync(userId);
            if (doctor is null)
                throw new NotFoundException("We couldn't find your account.");


            var clinic = await _unitOfWork.GetRepository<Clinic, int>().GetByIdAsync(clinicId);
            if (clinic is null)
                throw new NotFoundException("The clinic you are trying to access does not exist.");


            var doctorClinic = await _unitOfWork.GetRepository<DoctorClinic>().GetByCompositeKeyAsync(doctor.Id, clinic.Id);
            if (doctorClinic is null)
                throw new ResourceAccessDeniedException("You don't have access to this clinic.");
            if (!doctorClinic.IsOwner)
                throw new ResourceAccessDeniedException("Only the clinic owner can send invitations.");


            return new DoctorClinicContext
            {
                Doctor = doctor,
                Clinic = clinic,
                DoctorClinic = doctorClinic,
                IsOwner = doctorClinic.IsOwner,
            };
        }


    }
}
