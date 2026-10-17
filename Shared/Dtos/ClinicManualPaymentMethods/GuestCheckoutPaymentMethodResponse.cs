using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.ClinicManualPaymentMethods
{
    public class GuestCheckoutPaymentMethodResponse
    {
        public int Id { get; set; }
        public string Type { get; set; } = null!;
        public string AccountIdentifier { get; set; } = null!;
    }
}
