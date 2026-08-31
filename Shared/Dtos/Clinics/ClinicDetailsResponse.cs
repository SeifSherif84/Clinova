using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Clinics
{
    public class ClinicDetailsResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string StreetName { get; set; } = null!;
        public string BuildingNumber { get; set; } = null!;
        public string? Landmark { get; set; }
        public string? GoogleMapsUrl { get; set; }
        public decimal ConsultationFee { get; set; }
        public int RegionId { get; set; }
        public string RegionName { get; set; } = null!;
        public List<string> PhoneNumbers { get; set; } = new();
        public List<string> Images { get; set; } = new();
    }
}
