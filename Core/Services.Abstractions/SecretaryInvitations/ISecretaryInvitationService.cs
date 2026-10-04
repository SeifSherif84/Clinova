using Shared.Dtos.DoctorInvitations;
using Shared.Dtos.SecretaryInvitations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.SecretaryInvitations
{
    public interface ISecretaryInvitationService
    {
        Task<string> SendSecretaryInvitationAsync(string userId, int clinicId, SendSecretaryInvitationRequest request);
        Task<IEnumerable<SentSecretaryInvitationResponse>> GetSentSecretaryInvitationsAsync(string userId);
        Task<IEnumerable<ReceivedSecretaryInvitationResponse>> GetReceivedSecretaryInvitationsAsync(string userId);
        Task<string> AcceptSecretaryInvitationAsync(string userId, int secretaryInvitationId);
        Task<string> RejectSecretaryInvitationAsync(string userId, int secretaryInvitationId);
        Task<string> CancelSecretaryInvitationAsync(string userId, int secretaryInvitationId);
    }
}
