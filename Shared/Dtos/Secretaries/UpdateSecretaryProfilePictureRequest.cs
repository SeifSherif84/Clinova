using Microsoft.AspNetCore.Http;
using Shared.Attributes;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Patients
{
    public class UpdateSecretaryProfilePictureRequest
    {
        [Required]
        [AllowedImage]
        public IFormFile ProfilePicture { get; set; } = null!;
    }
}
