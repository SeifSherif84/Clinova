using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.DataProtection
{
    public interface IPaymentCredentialEncryptor
    {
        string Encrypt(string value);
        string Decrypt(string protectedValue);
    }
}
