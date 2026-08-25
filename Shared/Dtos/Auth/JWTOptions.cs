using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Store.G02.Shared
{
    public class JWTOptions
    {
        public string Issuer { get; set; } = null!;
        public string Audience { get; set; } = null!;
        public string SecurityKey { get; set; } = null!;
        public double ExpiredDurationInMinute { get; set; }

    }
}
