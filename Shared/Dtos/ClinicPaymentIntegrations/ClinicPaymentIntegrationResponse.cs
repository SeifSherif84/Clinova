using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.ClinicPaymentIntegrations
{
    public class ClinicPaymentIntegrationResponse
    {
        public int Id { get; set; }
        public string PaymentMethod { get; set; } = null!;
        public int IntegrationId { get; set; }
        public bool IsActive { get; set; }
    }
}
