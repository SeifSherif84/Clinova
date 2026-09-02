using Domain.Entities.BusinessEntities;
using Shared.Dtos.Invitations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.Invitations
{
    public interface IInvitationService 
    {
        Task<string> SendInvitationAsync(string userId, int clinicId, SendInvitationRequest request);
        Task<List<SentInvitationsResponse>> GetSentInvitationsAsync(string userId);
        Task<List<ReceivedInvitationsResponse>> GetReceivedInvitationsAsync(string userId);
        Task<string> AcceptInvitationAsync(string userId, int invitationId);
        Task<string> RejectInvitationAsync(string userId, int invitationId);
        Task<string> CancelInvitationAsync(string userId, int invitationId);
    }
}
