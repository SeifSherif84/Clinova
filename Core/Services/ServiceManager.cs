using AutoMapper;
using Domain.Contracts;
using Domain.Entities.Identity;
using MailKit;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Services.Abstractions;
using Services.Abstractions.Auth;
using Services.Abstractions.Clinics;
using Services.Abstractions.Doctors;
using Services.Abstractions.Lookups;
using Services.Auth;
using Services.Doctors;
using Services.MailKitFeature;
using Store.G02.Shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services
{
    public class ServiceManager(UserManager<UserApp> _userManager,
                                IMapper _mapper,
                                IConfiguration _configuration,
                                MailKitFeature.IMailService _mailService,
                                IOptions<JWTOptions> _jwtOptions,
                                IUnitOfWork _unitOfWork) : IServiceManager
    {
        public IAuthService AuthService { get; } = new AuthService(_userManager, _mapper, _configuration, _mailService, _jwtOptions);
        public IDoctorService DoctorService { get; } = new DoctorService(_unitOfWork, _mapper);
        public ILookupsService LookupsService { get; } = new LookupsService(_unitOfWork);
        public IClinicService ClinicService { get; } = new ClinicService(_unitOfWork, _mapper);
    }
}
