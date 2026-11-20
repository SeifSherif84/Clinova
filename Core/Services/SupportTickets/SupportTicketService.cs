using Domain.Contracts;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Domain.Entities.Identity;
using Domain.Exceptions.BadRequest;
using Domain.Exceptions.Forbidden;
using Domain.Exceptions.NotFound;
using Microsoft.AspNetCore.Identity;
using Services.Abstractions.Notifications;
using Services.Abstractions.SupportTickets;
using Services.Notifications;
using Services.Specifications.SupportTickets;
using Shared.Dtos.Appointments;
using Shared.Dtos.SupportTickets;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.SupportTickets
{
    internal class SupportTicketService(UserManager<UserApp> _userManager,
                                        IUnitOfWork _unitOfWork,
                                        INotificationService _notificationService) : ISupportTicketService
    {
        public async Task<string> PatientCreateSupportTicketAsync(string userId, PatientCreateSupportTicketRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("Unable to identify the current user.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                throw new BadRequestException("Unable to identify the current user.");

            if (string.IsNullOrWhiteSpace(request.OriginalMessage))
                throw new BadRequestException("Message is required.");

            var supportTicket = new SupportTicket
            {
                UserAppId = userId,
                UserApp = user,
                OriginalMessage = request.OriginalMessage.Trim(),
                Category = request.Category,
                Status = SupportTicketStatus.Open,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.GetRepository<SupportTicket, int>().AddAsync(supportTicket);

            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new BadRequestException("Your support request could not be submitted. Please try again.");

            return "Your support request has been submitted successfully. Our team will review it shortly.";
        }


        public async Task<IEnumerable<PatientSupportTicketResponse>> PatientGetHisOwnSupportTicketsAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("Unable to identify the current user.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                throw new BadRequestException("Unable to identify the current user.");

            var specification = SupportTicketSpecifications.PatientHisOwnGetSupportTickets(userId);
            var supportTickets = await _unitOfWork.GetRepository<SupportTicket, int>().GetAllAsync(specification);
            if (!supportTickets.Any())
                return Enumerable.Empty<PatientSupportTicketResponse>();

            var response = supportTickets
                .OrderByDescending(ticket => ticket.CreatedAt)
                .Select(ticket => new PatientSupportTicketResponse
                {
                    Id = ticket.Id,
                    Category = ticket.Category.ToString(),
                    Status = ticket.Status.ToString(),
                    OriginalMessage = ticket.OriginalMessage,
                    CreatedAt = ticket.CreatedAt,
                    Messages = ticket.Messages.OrderBy(message => message.CreatedAt)
                                              .Select(message => new SupportTicketMessageResponse
                                              {
                                                  Id = message.Id,
                                                  SenderId = message.SenderId,
                                                  Message = message.Message,
                                                  CreatedAt = message.CreatedAt
                                              }).ToList()
                }).ToList();

            return response;
        }


        public async Task<string> SendSupportTicketMessageAsync(string userId, int ticketId, SendSupportTicketMessageRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("Unable to identify the current user.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                throw new BadRequestException("Unable to identify the current user.");

            if (string.IsNullOrWhiteSpace(request.Message))
                throw new BadRequestException("Message is required.");
            var message = request.Message?.Trim();

            var specification = SupportTicketSpecifications.GetTicketById(ticketId);
            var ticket = await _unitOfWork.GetRepository<SupportTicket, int>().GetByIdAsync(specification);
            if (ticket is null)
                throw new NotFoundException($"Support ticket with ID {ticketId} was not found.");

            var isAdmin = await _userManager.IsInRoleAsync(user, "Admin");
            if (!isAdmin && ticket.UserAppId != userId)
                throw new ResourceAccessDeniedException("You are not authorized to send messages for this ticket.");

            var supportTicketMessage = new SupportTicketMessage
            {
                SupportTicketId = ticketId,
                SenderId = userId,
                Message = message!,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.GetRepository<SupportTicketMessage, int>().AddAsync(supportTicketMessage);

            // Reopen the ticket if the patient sends a new message
            // after the ticket has been resolved.
            if (!isAdmin && ticket.Status == SupportTicketStatus.Resolved)
                ticket.Status = SupportTicketStatus.Open;

            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new BadRequestException("Your message could not be sent. Please try again.");

            // Notify the patient when an admin replies to their support ticket.
            if (isAdmin)
            {
                await _notificationService.CreateAndSendAsync(
                    ticket.UserAppId,
                    "New Support Ticket Reply",
                    $"Our support team has posted a new reply to your support ticket #{ticket.Id}. Open the ticket to view the response.",
                    NotificationType.SupportTicketAdminReply);
            }

            return "Your message has been sent successfully.";
        }


        public async Task<PaginatedResult<AdminSupportTicketResponse>> AdminGetSupportTicketsAsync(string adminId, AdminSupportTicketQuery query)
        {
            if (string.IsNullOrWhiteSpace(adminId))
                throw new BadRequestException("We couldn't identify your account.");

            var user = await _userManager.FindByIdAsync(adminId);
            if (user is null)
                throw new NotFoundException("We couldn't find your account.");

            var isAdmin = await _userManager.IsInRoleAsync(user, "Admin");

            if (!isAdmin)
                throw new ResourceAccessDeniedException("You are not authorized to access support tickets.");

            var pageIndex = query.PageIndex < 1 ? 1 : Math.Min(query.PageIndex, 100);
            var pageSize = query.PageSize < 1 ? 10 : Math.Min(query.PageSize, 100);

            var supportTicketRepo = _unitOfWork.GetRepository<SupportTicket, int>();

            var countSpecification = SupportTicketSpecifications.ForAdmin(query.Status,
                                                                          pageIndex,
                                                                          pageSize,
                                                                          applyPagination: false);

            var totalCount = await supportTicketRepo.CountAsync(countSpecification);

            var dataSpecification = SupportTicketSpecifications.ForAdmin(query.Status,
                                                                         pageIndex,
                                                                         pageSize,
                                                                         applyPagination: true);

            var supportTickets = await supportTicketRepo.GetAllAsync(dataSpecification);

            var items = supportTickets.Select(ticket => new AdminSupportTicketResponse()
                {
                    Id = ticket.Id,
                    PatientId = ticket.UserAppId,
                    PatientName = $"{ticket.UserApp.FirstName} {ticket.UserApp.LastName}",
                    Category = ticket.Category.ToString(),
                    Status = ticket.Status.ToString(),
                    OriginalMessage = ticket.OriginalMessage,
                    CreatedAt = ticket.CreatedAt
                }).ToList();

            return new PaginatedResult<AdminSupportTicketResponse>
            {
                PageIndex = pageIndex,
                PageSize = pageSize,
                TotalCount = totalCount,
                Items = items
            };
        }


        public async Task<AdminSupportTicketDetailsResponse> AdminGetSupportTicketDetailsAsync(string adminId, int ticketId)
        {
            if (string.IsNullOrWhiteSpace(adminId))
                throw new BadRequestException("We couldn't identify your account.");

            var user = await _userManager.FindByIdAsync(adminId);
            if (user is null)
                throw new NotFoundException("We couldn't find your account.");

            var isAdmin = await _userManager.IsInRoleAsync(user, "Admin");
            if (!isAdmin)
                throw new ResourceAccessDeniedException("You are not authorized to access support tickets.");

            var specification = SupportTicketSpecifications.GetTicketDetailsById(ticketId);
            var ticket = await _unitOfWork.GetRepository<SupportTicket, int>().GetByIdAsync(specification);
            if (ticket is null)
                throw new NotFoundException($"Support ticket with ID {ticketId} was not found.");

            var response = new AdminSupportTicketDetailsResponse
            {
                Id = ticket.Id,
                PatientId = ticket.UserAppId,
                PatientName = $"{ticket.UserApp.FirstName} {ticket.UserApp.LastName}",
                Category = ticket.Category.ToString(),
                Status = ticket.Status.ToString(),
                OriginalMessage = ticket.OriginalMessage,
                CreatedAt = ticket.CreatedAt,
                Messages = ticket.Messages .OrderBy(message => message.CreatedAt)
                                           .Select(message => new SupportTicketMessageResponse
                                           {
                                               Id = message.Id,
                                               SenderId = message.SenderId,
                                               Message = message.Message,
                                               CreatedAt = message.CreatedAt
                                           }).ToList()
            };

            return response;
        }


        public async Task<string> AdminUpdateSupportTicketStatusAsync(string adminId,
                                                                      int ticketId,
                                                                      AdminUpdateSupportTicketStatusRequest request)
        {
            if (string.IsNullOrWhiteSpace(adminId))
                throw new BadRequestException("Unable to identify the current user.");

            var user = await _userManager.FindByIdAsync(adminId);
            if (user is null)
                throw new NotFoundException("We couldn't find your account.");

            var isAdmin = await _userManager.IsInRoleAsync(user, "Admin");
            if (!isAdmin)
                throw new ResourceAccessDeniedException("You are not authorized to update support tickets.");

            var specification = SupportTicketSpecifications.GetTicketById(ticketId);
            var ticket = await _unitOfWork.GetRepository<SupportTicket, int>().GetByIdAsync(specification);
            if (ticket is null)
                throw new NotFoundException($"Support ticket with ID {ticketId} was not found.");

            if (ticket.Status == request.Status)
                return $"Support ticket status is already {request.Status}.";

            ticket.Status = request.Status;

            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new BadRequestException("Support ticket status could not be updated. Please try again.");

            return $"Support ticket status has been updated to {request.Status} successfully.";
        }
    }
}
