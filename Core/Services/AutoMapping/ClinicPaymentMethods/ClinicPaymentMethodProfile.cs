using AutoMapper;
using Domain.Entities.BusinessEntities;
using Shared.Dtos.ClinicPaymentMethods;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.AutoMapping.ClinicPaymentMethods
{
    public class ClinicPaymentMethodProfile : Profile
    {
        public ClinicPaymentMethodProfile()
        {
            CreateMap<AddClinicPaymentMethodRequest, ClinicPaymentMethod>();

            CreateMap<ClinicPaymentMethod, ClinicPaymentMethodResponseForPatient>()
                .ForMember(dest => dest.Type, config => config.MapFrom(src => src.Type.ToString()));

            CreateMap<ClinicPaymentMethod, ClinicPaymentMethodResponseForOwner>()
                .ForMember(dest => dest.Type, config => config.MapFrom(src => src.Type.ToString()));
        }
    }
}
