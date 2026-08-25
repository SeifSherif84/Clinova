using Microsoft.AspNetCore.Http;
using Shared.Attributes;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Auth
{
    public class DoctorRegistrationRequest
    {

        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; } = null!;

        [Required]
        [MaxLength(50)]
        public string LastName { get; set; } = null!;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = null!;

        [Required]
        [Phone]
        public string PhoneNumber { get; set; } = null!;

        [Required]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$",
                                  ErrorMessage = "Password must be at least 8 characters and contain uppercase, lowercase, digit and special character.")]
        [DataType(DataType.Password)]
        public string Password { get; set; } = null!;

        [Required]
        [Compare(nameof(Password))]
        [DataType(DataType.Password)]
        public string ConfirmPassword { get; set; } = null!;


        [Required]
        public int MedicalSpecialtyId { get; set; }


        [Required]
        [MaxLength(50)]
        public string SyndicateNumber { get; set; } = null!;

        [Required]
        [AllowedImage]
        public IFormFile SyndicateCard { get; set; } = null!;

        [Required]
        [AllowedImage]
        public IFormFile NationalId { get; set; } = null!;
    }
}
