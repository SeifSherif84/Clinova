using AutoMapper;
using Domain.Entities.BusinessEntities;
using Shared.Dtos.AppointmentSlots;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.AutoMapping.AppointmentSlots
{
    public class AppointmentSlotProfile : Profile
    {
        public AppointmentSlotProfile()
        {
            CreateMap<AppointmentSlot, AvailableAppointmentSlotResponse>();
        }
    }
}
