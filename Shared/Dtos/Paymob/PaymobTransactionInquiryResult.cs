using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Paymob
{
    public class PaymobTransactionInquiryResult
    {
        public bool Succeeded { get; set; }
        public bool PendingVerification { get; set; }
        public bool NotFound { get; set; }
        public PaymobTransactionInquiryResponse? Transaction { get; set; }
        public string? ErrorMessage { get; set; }
        public string? ProviderResponse { get; set; }
    }
}
