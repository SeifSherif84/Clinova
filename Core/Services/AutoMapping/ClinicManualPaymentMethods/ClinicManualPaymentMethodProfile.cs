using AutoMapper;
using Domain.Entities.BusinessEntities;
using Shared.Dtos.ClinicManualPaymentMethods;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.AutoMapping.ClinicManualPaymentMethods
{
    public class ClinicManualPaymentMethodProfile : Profile
    {
        public ClinicManualPaymentMethodProfile()
        {
            CreateMap<AddClinicManualPaymentMethodRequest, ClinicManualPaymentMethod>();

            CreateMap<ClinicManualPaymentMethod, ClinicManualPaymentMethodResponseForPatient>()
                .ForMember(dest => dest.Type, config => config.MapFrom(src => src.Type.ToString()));

            CreateMap<ClinicManualPaymentMethod, ClinicManualPaymentMethodResponseForOwner>()
                .ForMember(dest => dest.Type, config => config.MapFrom(src => src.Type.ToString()));
        }
    }
}
