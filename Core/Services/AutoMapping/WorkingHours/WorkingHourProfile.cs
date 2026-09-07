using AutoMapper;
using Domain.Entities.BusinessEntities;
using Shared.Dtos.WorkingHours;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.AutoMapping.WorkingHours
{
    public class WorkingHourProfile : Profile
    {
        public WorkingHourProfile()
        {
            CreateMap<CreateWorkingHourRequest, WorkingHour>();

            //CreateMap<UpdateWorkingHourRequest, WorkingHour>()
            //    .ForAllMembers(config => config.Condition((S, D, srcMember) => srcMember != null));

            CreateMap<WorkingHour, WorkingHoursResponse>()
                .ForMember(dest => dest.Day, config => config.MapFrom(src => src.Day.ToString()));
        }
    }
}
