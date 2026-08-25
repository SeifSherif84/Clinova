using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Attributes
{
    public class AllowedImageAttribute : ValidationAttribute
    {
        private readonly string[] _allowedExtensions = [".jpg", ".jpeg", ".png"];
        private const long MaxFileSize = 5 * 1024 * 1024;

        protected override ValidationResult? IsValid(
            object? value,
            ValidationContext validationContext)
        {
            if (value is not IFormFile file)
                return ValidationResult.Success;

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!_allowedExtensions.Contains(extension))
            {
                return new ValidationResult(
                    "Only JPG, JPEG and PNG images are allowed.");
            }

            if (file.Length > MaxFileSize)
            {
                return new ValidationResult(
                    "Image size must not exceed 5 MB.");
            }

            return ValidationResult.Success;
        }
    }
}
