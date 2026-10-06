using Domain.Entities.Enums;
using Domain.Entities.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.BusinessEntities
{
    public class Secretary : UserApp
    {
        public string NationalIdImageUrl { get; set; } = null!;

        public int? ClinicId { get; set; }
        public Clinic? Clinic { get; set; }

        public ICollection<SecretaryInvitation> SecretaryInvitationsReceived { get; set; } = new List<SecretaryInvitation>();
    }
}
