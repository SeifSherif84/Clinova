using Services.Abstractions.Auth;
using Services.Abstractions.Doctors;
using Services.Abstractions.Lookups;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions
{
    public interface IServiceManager
    {
        IAuthService AuthService { get; }
        IDoctorService DoctorService { get; }
        ILookupsService LookupsService { get; }
    }
}
