using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.ClinicPaymentIntegrations
{
    public class AddClinicPaymentIntegrationRequest
    {
        public OnlinePaymentMethod PaymentMethod { get; set; }


        [Range(1, int.MaxValue)]
        public int IntegrationId { get; set; }
    }
}
