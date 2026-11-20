using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Auth
{
    public class AdminDoctorQuery
    {
        public DoctorApprovalStatus? ApprovalStatus { get; set; } = DoctorApprovalStatus.Pending;
        public string? SearchTerm { get; set; }
        public int PageIndex { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
