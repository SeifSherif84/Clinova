using AutoMapper;
using Domain.Entities.Identity;
using MailKit;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Services.Abstractions;
using Services.Abstractions.Auth;
using Services.Auth;
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
                                IOptions<JWTOptions> _jwtOptions) : IServiceManager
    {
        public IAuthService AuthService { get; } = new AuthService(_userManager, _mapper, _configuration, _mailService, _jwtOptions);
    }
}
