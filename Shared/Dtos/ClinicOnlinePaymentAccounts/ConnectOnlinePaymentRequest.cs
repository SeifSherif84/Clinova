using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.ClinicOnlinePaymentAccounts
{
    public class ConnectOnlinePaymentRequest
    {
        public OnlinePaymentProvider Provider { get; set; }
    }
}
