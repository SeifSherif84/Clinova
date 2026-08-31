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
        private readonly string[] _allowedExtensions =
            [".jpg", ".jpeg", ".png", ".webp"];

        private const long MaxFileSize = 5 * 1024 * 1024;

        protected override ValidationResult? IsValid(
            object? value,
            ValidationContext validationContext)
        {
            if (value is IFormFile file)
                return ValidateImage(file);

            if (value is IEnumerable<IFormFile> files)
            {
                foreach (var item in files)
                {
                    var result = ValidateImage(item);

                    if (result != ValidationResult.Success)
                        return result;
                }
            }

            return ValidationResult.Success;
        }

        private ValidationResult? ValidateImage(IFormFile file)
        {
            var extension = Path.GetExtension(file.FileName)
                .ToLowerInvariant();

            if (!_allowedExtensions.Contains(extension))
            {
                return new ValidationResult(
                    "Only JPG, JPEG, PNG, and WebP images are allowed.");
            }

            if (file.Length > MaxFileSize)
            {
                return new ValidationResult(
                    "Each image must not exceed 5 MB.");
            }

            return ValidationResult.Success;
        }
    }
}
