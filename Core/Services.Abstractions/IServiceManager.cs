using Services.Abstractions.AppointmentSlots;
using Services.Abstractions.Auth;
using Services.Abstractions.Clinics;
using Services.Abstractions.Doctors;
using Services.Abstractions.Invitations;
using Services.Abstractions.Lookups;
using Services.Abstractions.Notifications;
using Services.Abstractions.Patients;
using Services.Abstractions.ClinicManualPaymentMethods;
using Services.Abstractions.WorkingHours;
using Services.Abstractions.Appointments;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Services.Abstractions.ClinicOnlinePaymentAccounts;
using Services.Abstractions.ClinicPaymentIntegrations;
using Services.Abstractions.Payments;


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
        IClinicManualPaymentMethodService ClinicManualPaymentMethodService { get; }
        IAppointmentService AppointmentService { get; }
        IClinicOnlinePaymentAccountService ClinicOnlinePaymentAccountService { get; }
        IClinicPaymentIntegrationService ClinicPaymentIntegrationService { get; }
        IPaymentService PaymentService { get; }
    }
}
