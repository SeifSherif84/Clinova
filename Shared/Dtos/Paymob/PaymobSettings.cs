using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Paymob
{
    public class PaymobSettings
    {
        public string BaseUrl { get; set; } = null!;

        // Used for Transaction Inquiry / reconciliation.
        public string ApiKey { get; set; } = null!;
    }
}
