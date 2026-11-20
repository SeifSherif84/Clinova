using Shared.Dtos.Appointments;
using Shared.Dtos.SupportTickets;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.SupportTickets
{
    public interface ISupportTicketService
    {
        Task<string> PatientCreateSupportTicketAsync(string userId, PatientCreateSupportTicketRequest request);
        Task<IEnumerable<PatientSupportTicketResponse>> PatientGetHisOwnSupportTicketsAsync(string userId);
        Task<string> SendSupportTicketMessageAsync(string userId, int ticketId, SendSupportTicketMessageRequest request);
        Task<PaginatedResult<AdminSupportTicketResponse>> AdminGetSupportTicketsAsync(string adminId, AdminSupportTicketQuery query);
        Task<AdminSupportTicketDetailsResponse> AdminGetSupportTicketDetailsAsync(string adminId, int ticketId);
        Task<string> AdminUpdateSupportTicketStatusAsync(string adminId, int ticketId, AdminUpdateSupportTicketStatusRequest request);
    }
}
