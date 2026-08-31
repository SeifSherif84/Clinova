using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Clinics
{
    public class UpdateClinicRequest
    {
        [MaxLength(100)]
        public string? Name { get; set; }


        [MaxLength(150)]
        public string? StreetName { get; set; }


        [MaxLength(10)]
        public string? BuildingNumber { get; set; }


        [MaxLength(100)]
        public string? Landmark { get; set; }


        [Url]
        [MaxLength(500)]
        public string? GoogleMapsUrl { get; set; }


        [Range(0, 100000)]
        public decimal? ConsultationFee { get; set; }


        [Range(1, int.MaxValue)]
        public int? RegionId { get; set; }
    }
}
