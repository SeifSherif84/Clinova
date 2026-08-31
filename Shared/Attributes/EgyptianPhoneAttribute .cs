using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Shared.Attributes
{
    public class EgyptianPhoneAttribute : ValidationAttribute
    {
        private static readonly Regex EgyptianPhoneRegex =
            new(@"^01[0125]\d{8}$");

        protected override ValidationResult? IsValid(
            object? value,
            ValidationContext validationContext)
        {
            if (value is string phoneNumber)
                return ValidatePhoneNumber(phoneNumber);

            if (value is IEnumerable<string> phoneNumbers)
            {
                foreach (var phone in phoneNumbers)
                {
                    var result = ValidatePhoneNumber(phone);

                    if (result != ValidationResult.Success)
                        return result;
                }
            }

            return ValidationResult.Success;
        }

        private static ValidationResult? ValidatePhoneNumber(string phoneNumber)
        {
            if (!EgyptianPhoneRegex.IsMatch(phoneNumber))
            {
                return new ValidationResult(
                    $"'{phoneNumber}' is not a valid Egyptian mobile phone number.");
            }

            return ValidationResult.Success;
        }
    }
}
