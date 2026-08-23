using Domain.Entities.Enums;
using Domain.Entities.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.BusinessEntities
{
    public class Doctor : UserApp
    {
        public string Title { get; set; } = null!;
        public int ExperienceYears { get; set; }
        public string? Bio { get; set; }
        public bool IsApprovedByAdmin { get; set; } = false;


        public int MedicalSpecialtyId { get; set; }
        public MedicalSpecialty MedicalSpecialty { get; set; } = null!;


        public ICollection<DoctorClinic> DoctorClinics { get; set; } = new List<DoctorClinic>(); 
        public ICollection<Invitation> InvitationsSent { get; set; } = new List<Invitation>();
        public ICollection<Invitation> InvitationsReceived { get; set; } = new List<Invitation>();
    }
}
