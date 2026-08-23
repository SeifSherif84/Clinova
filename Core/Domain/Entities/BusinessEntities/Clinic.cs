using Domain.Entities.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.BusinessEntities
{
    public class Clinic : BaseEntity<int>
    {
        public string Name { get; set; } = null!;
        public string StreetName { get; set; } = null!;
        public string BuildingNumber { get; set; } = null!; 
        public string? Landmark { get; set; }
        public string? Location { get; set; }
        public decimal ConsultationFee { get; set; }

        public ICollection<DoctorClinic> DoctorClinics { get; set; } = new List<DoctorClinic>();
        public ICollection<ClinicPhoneNumbers> PhoneNumbers { get; set; } = new List<ClinicPhoneNumbers>();
        public ICollection<ClinicImages> Images { get; set; } = new List<ClinicImages>();
        public ICollection<Secretary> Secretaries { get; set; } = new List<Secretary>();
        public ICollection<Invitation> Invitations { get; set; } = new List<Invitation>();

        public int RegionId { get; set; }
        public Region Region { get; set; } = null!;
    }
}
