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
using Services.Abstractions.Clinics;
using Services.Abstractions.Invitations;
using Services.Abstractions.Notifications;
using Services.Clinics;
using Services.Specifications.Clinics;
using Services.Specifications.Invitations;
using Shared.Dtos.Invitations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace Services.Invitations
{
    public class InvitationService(UserManager<UserApp> _userManager,
                                   IUnitOfWork _unitOfWork,
                                   IMapper _mapper,
                                   INotificationService _notificationService) : IInvitationService
    {

        public async Task<string> SendInvitationAsync(string userId, int clinicId, SendInvitationRequest request)
        {
            var doctorOwnedClinicAccess = await GetDoctorOwnedClinicAccessAsync(userId, clinicId);
            
            var receiverUser = await _userManager.FindByEmailAsync(request.Email);
            if (receiverUser is null)
                throw new NotFoundException("The user you are trying to invite does not exist.");

            var receiverDoctor = await _unitOfWork.GetRepository<Doctor, string>().GetByIdAsync(receiverUser.Id);
            if (receiverDoctor is null)
                throw new NotFoundException("The user you are trying to invite is not a doctor.");

            var receiverDoctorClinic = await _unitOfWork.GetRepository<DoctorClinic>().GetByCompositeKeyAsync(receiverDoctor.Id, clinicId);
            if (receiverDoctorClinic is not null)
                throw new BadRequestException("This doctor is already a member of this clinic.");

            var invitationSpec = new InvitationSpecifications(doctorOwnedClinicAccess.Doctor.Id, receiverDoctor.Id, clinicId, InvitationStatus.Pending);
            var existingInvitation = await _unitOfWork.GetRepository<Invitation, int>().GetByIdAsync(invitationSpec);
            if (existingInvitation is not null)
                throw new BadRequestException("An invitation has already been sent to this user and is still pending.");

            var newInvitation = new Invitation()
            {
                DoctorSender = doctorOwnedClinicAccess.Doctor,
                DoctorReceiver = receiverDoctor,
                Clinic = doctorOwnedClinicAccess.Clinic,
                Status = InvitationStatus.Pending,
                SentAt = DateTime.UtcNow
            };

            await _unitOfWork.GetRepository<Invitation, int>().AddAsync(newInvitation);
            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException("We couldn't send the invitation right now. Please try again later.");


            await _notificationService.CreateAndSendAsync(
                receiverDoctor.Id,
                "New Clinic Invitation",
                $"Dr. {doctorOwnedClinicAccess.Doctor.FirstName} {doctorOwnedClinicAccess.Doctor.LastName} invited you to join {doctorOwnedClinicAccess.Clinic.Name}.",
                NotificationType.InvitationReceived);

            return "The invitation has been sent successfully.";
        }



        public async Task<IEnumerable<SentInvitationResponse>> GetSentInvitationsAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var doctor = await _unitOfWork.GetRepository<Doctor, string>().GetByIdAsync(userId);
            if (doctor is null)
                throw new NotFoundException("We couldn't find your account.");


            var invitationSpec = new InvitationSpecifications(userId, InvitationDirection.Sent, includeReceiver: true, includeClinic: true);
            var invitations = await _unitOfWork.GetRepository<Invitation, int>().GetAllAsync(invitationSpec);
            if (!invitations.Any())
                return Enumerable.Empty<SentInvitationResponse>();

            return _mapper.Map<List<SentInvitationResponse>>(invitations);
        }



        public async Task<IEnumerable<ReceivedInvitationResponse>> GetReceivedInvitationsAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");


            var doctor = await _unitOfWork.GetRepository<Doctor, string>().GetByIdAsync(userId);
            if (doctor is null)
                throw new NotFoundException("We couldn't find your account.");


            var invitationSpec = new InvitationSpecifications(userId, InvitationDirection.Received, includeSender: true, includeClinic: true);
            var invitations = await _unitOfWork.GetRepository<Invitation, int>().GetAllAsync(invitationSpec);
            if (!invitations.Any())
                return Enumerable.Empty<ReceivedInvitationResponse>();

            return _mapper.Map<List<ReceivedInvitationResponse>>(invitations);
        }



        public async Task<string> AcceptInvitationAsync(string userId, int invitationId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");


            var doctor = await _unitOfWork.GetRepository<Doctor, string>().GetByIdAsync(userId);
            if (doctor is null)
                throw new NotFoundException("We couldn't find your account.");

            var invitationSpec = new InvitationSpecifications(invitationId, includeClinic: true);
            var invitation = await _unitOfWork.GetRepository<Invitation, int>().GetByIdAsync(invitationSpec);
            if (invitation is null)
                throw new NotFoundException("The invitation you are trying to accept does not exist.");

            if (invitation.DoctorReceiverId != userId)
                throw new ResourceAccessDeniedException("You don't have access to this invitation.");

            if (invitation.Status is not InvitationStatus.Pending)
                throw new BadRequestException("This invitation is no longer pending.");

            var existingdoctorClinic = await _unitOfWork.GetRepository<DoctorClinic>().GetByCompositeKeyAsync(doctor.Id, invitation.ClinicId);
            if (existingdoctorClinic is not null)
                throw new BadRequestException("You are already a member of this clinic.");

            invitation.Status = InvitationStatus.Accepted;
            invitation.RespondedAt = DateTime.UtcNow;

            var doctorClinic = new DoctorClinic()
            {
                Doctor = doctor,
                ClinicId = invitation.ClinicId,
                IsOwner = false
            };

            await _unitOfWork.GetRepository<DoctorClinic>().AddAsync(doctorClinic);
            var result = await _unitOfWork.SaveChangesAsync();
            if(result == 0)
                throw new InternalServerErrorException("We couldn't accept the invitation right now. Please try again later.");


            await _notificationService.CreateAndSendAsync(
                invitation.DoctorSenderId,
                "Invitation Accepted",
                $"Dr. {doctor.FirstName} {doctor.LastName} accepted your invitation to join {invitation.Clinic.Name}.",
                NotificationType.InvitationAccepted);   


            return "You have successfully joined the clinic.";
        }



        public async Task<string> RejectInvitationAsync(string userId, int invitationId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var doctor = await _unitOfWork.GetRepository<Doctor, string>().GetByIdAsync(userId);
            if (doctor is null)
                throw new NotFoundException("We couldn't find your account.");

            var invitationSpec = new InvitationSpecifications(invitationId, includeClinic: true);
            var invitation = await _unitOfWork.GetRepository<Invitation, int>().GetByIdAsync(invitationSpec);

            if (invitation is null)
                throw new NotFoundException("The invitation you are trying to reject does not exist.");

            if (invitation.DoctorReceiverId != userId)
                throw new ResourceAccessDeniedException("You don't have access to this invitation.");

            if (invitation.Status is not InvitationStatus.Pending)
                throw new BadRequestException("This invitation is no longer pending.");

            invitation.Status = InvitationStatus.Rejected;
            invitation.RespondedAt = DateTime.UtcNow;

            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException("We couldn't reject the invitation right now. Please try again later.");

            await _notificationService.CreateAndSendAsync(
                invitation.DoctorSenderId,
                "Invitation Rejected",
                $"Dr. {doctor.FirstName} {doctor.LastName} reject your invitation to join {invitation.Clinic.Name}.",
                NotificationType.InvitationRejected);

            return "You have successfully rejected the invitation.";
        }



        public async Task<string> CancelInvitationAsync(string userId, int invitationId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var doctor = await _unitOfWork.GetRepository<Doctor, string>().GetByIdAsync(userId);
            if (doctor is null)
                throw new NotFoundException("We couldn't find your account.");

            var invitationSpec = new InvitationSpecifications(invitationId, includeClinic: true);
            var invitation = await _unitOfWork.GetRepository<Invitation, int>().GetByIdAsync(invitationSpec);

            if (invitation is null)
                throw new NotFoundException("The invitation you are trying to cancel does not exist.");

            if (invitation.DoctorSenderId != userId)
                throw new ResourceAccessDeniedException("You don't have access to this invitation.");

            if (invitation.Status is not InvitationStatus.Pending)
                throw new BadRequestException("This invitation is no longer pending.");

            _unitOfWork.GetRepository<Invitation, int>().Delete(invitation);
            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException("We couldn't cancel the invitation right now. Please try again later.");


            await _notificationService.CreateAndSendAsync(
                invitation.DoctorReceiverId,
                "Invitation Canceled",
                $"Dr. {doctor.FirstName} {doctor.LastName} canceled the invitation to join {invitation.Clinic.Name}.",
                NotificationType.InvitationCancelled);

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
                IsOwner = doctorClinic.IsOwner
            };
        }



    }
}
