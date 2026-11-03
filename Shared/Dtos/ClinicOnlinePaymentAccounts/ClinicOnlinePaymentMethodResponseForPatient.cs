using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.ClinicOnlinePaymentAccounts
{
    public class ClinicOnlinePaymentMethodResponseForPatient
    {
        public int Id { get; set; }
        public string OnlinePaymentMethodType { get; set; } = null!;
    }
}
