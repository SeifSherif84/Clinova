using Microsoft.AspNetCore.DataProtection;
using Services.Abstractions.DataProtection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.DataProtection
{
    public class PaymentCredentialEncryptor : IPaymentCredentialEncryptor
    {
        private readonly IDataProtector _protector;

        public PaymentCredentialEncryptor(IDataProtectionProvider dataProtectionProvider)
        {
            _protector = dataProtectionProvider.CreateProtector("Clinova.PaymentCredentials.v1");
        }

        public string Encrypt(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("Credential value cannot be empty.", nameof(value));

            return _protector.Protect(value);
        }

        public string Decrypt(string protectedValue)
        {
            if (string.IsNullOrWhiteSpace(protectedValue))
                throw new ArgumentException("Protected credential cannot be empty.", nameof(protectedValue));

            return _protector.Unprotect(protectedValue);
        }

    }
}
