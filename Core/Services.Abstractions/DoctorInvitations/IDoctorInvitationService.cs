using Domain.Entities.BusinessEntities;
using Shared.Dtos.DoctorInvitations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.DoctorInvitations
{
    public interface IDoctorInvitationService 
    {
        Task<string> SendDoctorInvitationAsync(string userId, int clinicId, SendDoctorInvitationRequest request);
        Task<IEnumerable<SentDoctorInvitationResponse>> GetSentDoctorInvitationsAsync(string userId);
        Task<IEnumerable<ReceivedDoctorInvitationResponse>> GetReceivedDoctorInvitationsAsync(string userId);
        Task<string> AcceptDoctorInvitationAsync(string userId, int doctorInvitationId);
        Task<string> RejectDoctorInvitationAsync(string userId, int doctorInvitationId);
        Task<string> CancelDoctorInvitationAsync(string userId, int doctorInvitationId);
    }
}
