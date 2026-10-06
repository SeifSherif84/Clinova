using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Clinics
{
    public class ClinicSecretaryResponse
    {
        public string Id { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string? ProfilePicture { get; set; }
    }
}
