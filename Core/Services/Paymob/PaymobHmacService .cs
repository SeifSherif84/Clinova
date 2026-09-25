using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Security.Cryptography;
using Shared.Dtos.Paymob;
using Services.Abstractions.Paymob;

namespace Services.Paymob
{
    public class PaymobHmacService : IPaymobHmacService
    {
        public bool IsValid(PaymobTransactionCallbackObject transaction, string receivedHmac, string hmacSecret)
        {
            if (string.IsNullOrWhiteSpace(receivedHmac))
                return false;

            if (string.IsNullOrWhiteSpace(hmacSecret))
                return false;

            var concatenatedValues = string.Concat(
                transaction.AmountCents,
                transaction.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.ffffff"),
                transaction.Currency ?? string.Empty,
                transaction.ErrorOccurred.ToString().ToLowerInvariant(),
                transaction.HasParentTransaction.ToString().ToLowerInvariant(),
                transaction.Id,
                transaction.IntegrationId,
                transaction.Is3DSecure.ToString().ToLowerInvariant(),
                transaction.IsAuth.ToString().ToLowerInvariant(),
                transaction.IsCapture.ToString().ToLowerInvariant(),
                transaction.IsRefunded.ToString().ToLowerInvariant(),
                transaction.IsStandalonePayment.ToString().ToLowerInvariant(),
                transaction.IsVoided.ToString().ToLowerInvariant(),
                transaction.Order.Id,
                transaction.Owner,
                transaction.Pending.ToString().ToLowerInvariant(),
                transaction.SourceData?.Pan ?? string.Empty,
                transaction.SourceData?.SubType ?? string.Empty,
                transaction.SourceData?.Type ?? string.Empty,
                transaction.Success.ToString().ToLowerInvariant()
            );

            using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(hmacSecret));
            var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(concatenatedValues));
            var computedHmac = Convert.ToHexString(computedHash).ToLowerInvariant();

            return CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(computedHmac),
                                                           Encoding.UTF8.GetBytes(receivedHmac.ToLowerInvariant()));
        }
    }
}
