using AutoMapper;
using Domain.Contracts;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Identity;
using MailKit;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Services.Abstractions;
using Services.Abstractions.AppointmentSlots;
using Services.Abstractions.Auth;
using Services.Abstractions.ClinicManualPaymentMethods;
using Services.Abstractions.Clinics;
using Services.Abstractions.Doctors;
using Services.Abstractions.Invitations;
using Services.Abstractions.Lookups;
using Services.Abstractions.Notifications;
using Services.Abstractions.Patients;
using Services.Abstractions.WorkingHours;
using Services.AppointmentSlots;
using Services.Auth;
using Services.Doctors;
using Services.Invitations;
using Services.MailKitFeature;
using Services.Notifications;
using Services.Patients;
using Services.WorkingHours;
using Services.ClinicManualPaymentMethods;
using Shared.Dtos.Auth;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Services.Abstractions.Appointments;
using Services.Appointments;
using Services.Abstractions.ClinicOnlinePaymentAccounts;
using Services.ClinicOnlinePaymentAccounts;
using Services.Abstractions.ClinicPaymentIntegrations;
using Services.ClinicPaymentIntegrations;
using Services.Abstractions.Payments;
using Services.Payments;
using Services.Abstractions.Paymob;
using Services.Abstractions.DataProtection;
using Shared.Dtos.ClinovaSettings;

namespace Services
{
    public class ServiceManager(UserManager<UserApp> _userManager,
                                IMapper _mapper,
                                IConfiguration _configuration,
                                MailKitFeature.IMailService _mailService,
                                IOptions<JWTOptions> _jwtOptions,
                                IUnitOfWork _unitOfWork,
                                INotificationService _notificationService,
                                INotificationPublisher _notificationPublisher,
                                IAppointmentSlotService _appointmentSlotService,
                                IPaymobService _paymobService,
                                IPaymobHmacService _paymobHmacService,
                                IPaymentCredentialEncryptor _paymentCredentialEncryptor,
                                IRefundService _refundService,
                                IOptions<CancellationPolicySettings> _cancellationPolicy) : IServiceManager
    {
        public IAuthService AuthService { get; } = new AuthService(_userManager, _mapper, _configuration, _mailService, _jwtOptions);
        public IDoctorService DoctorService { get; } = new DoctorService(_unitOfWork, _mapper);
        public ILookupsService LookupsService { get; } = new LookupsService(_unitOfWork);
        public IClinicService ClinicService { get; } = new ClinicService(_unitOfWork, _mapper, _notificationService);
        public IInvitationService InvitationService { get; } = new InvitationService(_userManager, _unitOfWork, _mapper, _notificationService);
        public INotificationService NotificationService { get; } = new NotificationService(_unitOfWork, _mapper, _notificationPublisher);
        public IWorkingHourService WorkingHourService { get; } = new WorkingHourService(_unitOfWork, _mapper, _appointmentSlotService);
        public IAppointmentSlotService AppointmentSlotService { get; } = new AppointmentSlotService(_unitOfWork, _configuration, _mapper);
        public IPatientService PatientService { get; } = new PatientService(_unitOfWork, _mapper);
        public IClinicManualPaymentMethodService ClinicManualPaymentMethodService { get; } = new ClinicManualPaymentMethodService(_unitOfWork, _mapper);
        public IAppointmentService AppointmentService { get; } = new AppointmentService(_unitOfWork, _mapper, _cancellationPolicy, _refundService);
        public IClinicOnlinePaymentAccountService ClinicOnlinePaymentAccountService { get; } = new ClinicOnlinePaymentAccountService(_unitOfWork, _paymentCredentialEncryptor);
        public IClinicPaymentIntegrationService ClinicPaymentIntegrationService { get; } = new ClinicPaymentIntegrationService(_unitOfWork);
        public IPaymentService PaymentService { get; } = new PaymentService(_unitOfWork, _paymobService, _paymobHmacService, _paymentCredentialEncryptor, _notificationService);
    }
}
