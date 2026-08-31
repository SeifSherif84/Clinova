using Microsoft.AspNetCore.Http;
using Shared.Attributes;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Clinics
{
    public class AddClinicImagesRequest
    {
        [Required]
        [MaxLength(6)]
        [AllowedImage]
        public List<IFormFile> Images { get; set; } = null!;
    }
}
