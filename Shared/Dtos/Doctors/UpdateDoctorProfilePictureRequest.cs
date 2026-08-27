using Microsoft.AspNetCore.Http;
using Shared.Attributes;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Doctors
{
    public class UpdateDoctorProfilePictureRequest
    {
        [Required]
        [AllowedImage]
        public IFormFile ProfilePicture { get; set; } = null!;
    }
}
