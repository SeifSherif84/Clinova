using AutoMapper;
using Domain.Entities.BusinessEntities;
using Shared.Dtos.Notifications;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.AutoMapping.Notifications
{
    public class NotificationProfile : Profile
    {
        public NotificationProfile()
        {
            CreateMap<Notification, NotificationResponse>()
                .ForMember(dest => dest.Type, config => config.MapFrom(src => src.Type.ToString()));
        }
    }
}
