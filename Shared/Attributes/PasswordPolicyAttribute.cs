using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Attributes
{
    public class PasswordPolicyAttribute : RegularExpressionAttribute
    {
        private const string PasswordPattern = @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$";
        public PasswordPolicyAttribute() : base(PasswordPattern)
        {
            ErrorMessage = "Password must be at least 8 characters and contain uppercase, lowercase, digit and special character.";
        }
    }
}
