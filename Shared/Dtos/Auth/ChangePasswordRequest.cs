using Shared.Attributes;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Auth
{
    public class ChangePasswordRequest
    {
        [Required]
        [DataType(DataType.Password)]
        public string CurrentPassword { get; set; } = null!;


        [Required]
        [DataType(DataType.Password)]
        [PasswordPolicy]
        public string NewPassword { get; set; } = null!;


        [Required]
        [DataType(DataType.Password)]
        [Compare(nameof(NewPassword))]
        public string ConfirmPassword { get; set; } = null!;
    }
}
