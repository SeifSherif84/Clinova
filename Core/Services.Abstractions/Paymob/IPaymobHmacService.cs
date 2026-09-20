using Shared.Dtos.Paymob;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.Paymob
{
    public interface IPaymobHmacService
    {
        bool IsValid(PaymobTransactionCallbackObject transaction, string receivedHmac, string hmacSecret);
    }
}
