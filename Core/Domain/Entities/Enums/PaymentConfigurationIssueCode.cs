using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.Enums
{
    public enum PaymentConfigurationIssueCode
    {
        None = 0,
        PaymobAuthenticationFailed = 1,
        InvalidIntegration = 2,
        HmacVerificationFailed = 3,
        ProviderUnavailable = 4,
        UnknownConfigurationIssue = 5
    }
}
