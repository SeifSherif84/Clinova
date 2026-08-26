using Shared.Attributes;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Auth
{
    public class PatientRegistrationRequest
    {
        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; } = null!;

        [Required]
        [MaxLength(50)]
        public string LastName { get; set; } = null!;


        [Required]
        [EmailAddress]
        [MaxLength(256)]
        public string Email { get; set; } = null!;


        [Required]
        [Phone]
        public string PhoneNumber { get; set; } = null!;

        [Required]
        [PasswordPolicy]
        [DataType(DataType.Password)]
        public string Password { get; set; } = null!;


        [Required]
        [Compare(nameof(Password), ErrorMessage = "Passwords do not match.")]
        [DataType(DataType.Password)]
        public string ConfirmPassword { get; set; } = null!;
    }
}
