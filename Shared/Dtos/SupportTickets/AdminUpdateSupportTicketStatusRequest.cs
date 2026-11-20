using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.SupportTickets
{
    public class AdminUpdateSupportTicketStatusRequest
    {
        [EnumDataType(typeof(SupportTicketStatus))]
        public SupportTicketStatus Status { get; set; }
    }
}
