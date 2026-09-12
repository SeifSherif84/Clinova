using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
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


        public static ClinicPaymentMethodSpecifications ByClinicAndType(int clinicId, PaymentMethodType type)
        {
            return new ClinicPaymentMethodSpecifications
            {
                Criteria = paymentMethod => paymentMethod.ClinicId == clinicId &&
                                            paymentMethod.Type == type
            };
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