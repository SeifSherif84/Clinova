using Services.Abstractions.AppointmentSlots;
using Services.Abstractions.Auth;
using Services.Abstractions.Clinics;
using Services.Abstractions.Doctors;
using Services.Abstractions.Invitations;
using Services.Abstractions.Lookups;
using Services.Abstractions.Notifications;
using Services.Abstractions.Patients;
using Services.Abstractions.WorkingHours;
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
        IClinicService ClinicService { get; }
        IInvitationService InvitationService { get; }
        INotificationService NotificationService { get; }
        IWorkingHourService WorkingHourService { get; }
        IAppointmentSlotService AppointmentSlotService { get; }
        IPatientService PatientService { get; }
    }
}
