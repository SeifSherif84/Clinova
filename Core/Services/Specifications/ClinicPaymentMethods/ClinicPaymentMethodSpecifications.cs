using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Shared.Dtos.ClinicPaymentMethods;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Services.Specifications.ClinicPaymentMethods
{
    public class ClinicPaymentMethodSpecifications : BaseSpecifications<ClinicPaymentMethod, int>
    {
        private ClinicPaymentMethodSpecifications() : base()
        {

        }

        public static ClinicPaymentMethodSpecifications ByClinic(int clinicId)
        {
            return new ClinicPaymentMethodSpecifications
            {
                Criteria = paymentMethod => paymentMethod.ClinicId == clinicId
            };
        }


        public static ClinicPaymentMethodSpecifications ByClinicAndPaymentDetails(int clinicId, AddClinicPaymentMethodRequest request)
        {

            if(request.Type == PaymentMethodType.VodafoneCash || request.Type == PaymentMethodType.InstaPay)
            {
                return new ClinicPaymentMethodSpecifications
                {

                    Criteria = paymentMethod => paymentMethod.ClinicId == clinicId &&
                                                paymentMethod.Type == request.Type &&
                                                paymentMethod.AccountIdentifier == request.AccountIdentifier
                };
            }

            if (request.Type == PaymentMethodType.OnlineGateway)
            {
                return new ClinicPaymentMethodSpecifications
                {

                    Criteria = paymentMethod => paymentMethod.ClinicId == clinicId &&
                                                paymentMethod.Type == request.Type &&
                                                paymentMethod.Provider == request.Provider &&
                                                paymentMethod.ProviderAccountId == request.ProviderAccountId
                };
            }

            return new ClinicPaymentMethodSpecifications();
        }


        public static ClinicPaymentMethodSpecifications ActiveByClinic(int clinicId)
        {
            return new ClinicPaymentMethodSpecifications
            {
                Criteria = paymentMethod => paymentMethod.ClinicId == clinicId &&
                                            paymentMethod.IsActive
            };
        }


        public static ClinicPaymentMethodSpecifications ByIdWithPayments(int paymentMethodId)
        {
            var specification = new ClinicPaymentMethodSpecifications
            {
                Criteria = paymentMethod => paymentMethod.Id == paymentMethodId
            };
            specification.Includes.Add(paymentMethod => paymentMethod.Payments);
            return specification;
        }
    }
}