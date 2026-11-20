using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Specifications.SupportTickets
{
    public class SupportTicketSpecifications : BaseSpecifications<SupportTicket, int>
    {
        public static SupportTicketSpecifications PatientHisOwnGetSupportTickets(string userId)
        {
            var specification = new SupportTicketSpecifications()
            {
                Criteria = ticket => ticket.UserAppId == userId
            };

            specification.Includes.Add(ticket => ticket.Messages);

            return specification;
        }

        public static SupportTicketSpecifications GetTicketById(int ticketId)
        {
            var specification = new SupportTicketSpecifications()
            {
                Criteria = ticket => ticket.Id == ticketId
            };

            return specification;
        }


        public static SupportTicketSpecifications ForAdmin(SupportTicketStatus? status, 
                                                           int pageIndex,
                                                           int pageSize,
                                                           bool applyPagination)
        {
            var specification = new SupportTicketSpecifications
            {
                Criteria = ticket => (!status.HasValue || ticket.Status == status.Value)
            };

            specification.OrderByDescending = ticket => ticket.CreatedAt;

            if (applyPagination)
            {
                specification.IsPaginationEnabled = true;
                specification.Skip = (pageIndex - 1) * pageSize;
                specification.Take = pageSize;
                specification.Includes.Add(ticket => ticket.UserApp);
            }

            return specification;
        }



        public static SupportTicketSpecifications GetTicketDetailsById(int ticketId)
        {
            var specification = new SupportTicketSpecifications
            {
                Criteria = ticket => ticket.Id == ticketId
            };

            specification.Includes.Add(ticket => ticket.UserApp);
            specification.Includes.Add(ticket => ticket.Messages);

            return specification;
        }

    }
}
