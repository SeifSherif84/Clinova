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
    public class AddClinicRequest
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = null!;


        [Required]
        [MaxLength(150)]
        public string StreetName { get; set; } = null!;


        [Required]
        [MaxLength(10)]
        public string BuildingNumber { get; set; } = null!;


        [MaxLength(100)]
        public string? Landmark { get; set; }


        [Url]
        [MaxLength(500)]
        public string? GoogleMapsUrl { get; set; }


        [Required]
        [Range(0, 100000)]
        public decimal ConsultationFee { get; set; }


        [Required]
        [Range(1, int.MaxValue)]
        public int RegionId { get; set; }


        [MaxLength(6)]
        [AllowedImage]
        public List<IFormFile> Images { get; set; } = new List<IFormFile>();


        [MaxLength(6)]
        [EgyptianPhone]
        public List<string> PhoneNumbers { get; set; } = new List<string>();
    }
}
