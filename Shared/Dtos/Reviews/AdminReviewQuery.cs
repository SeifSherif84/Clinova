using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Reviews
{
    public class AdminReviewQuery
    {
        [EnumDataType(typeof(ReviewStatus))]
        public ReviewStatus? Status { get; set; }
        public string? SearchTerm { get; set; }

        public int PageIndex { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
