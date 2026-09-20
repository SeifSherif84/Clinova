using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.ClinicOnlinePaymentAccounts
{
    public class ConnectOnlinePaymentResponse
    {
        public int AccountId { get; set; }
        public string Provider { get; set; } = null!;
        public string Status { get; set; } = null!;
        public bool IsReady { get; set; }
        public string Message { get; set; } = null!;
    }
}
