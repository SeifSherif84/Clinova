using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Exceptions
{
    public class PaymobApiException : Exception
    {
        public HttpStatusCode StatusCode { get; }
        public PaymentConfigurationIssueCode? ConfigurationIssueCode { get; }
        public string? ProviderResponse { get; }

        public PaymobApiException(HttpStatusCode statusCode,
                                  string message,
                                  PaymentConfigurationIssueCode? configurationIssueCode = null,
                                  string? providerResponse = null) : base(message)
        {
            StatusCode = statusCode;
            ConfigurationIssueCode = configurationIssueCode;
            ProviderResponse = providerResponse;
        }
    }
}
