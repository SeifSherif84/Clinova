using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Shared.Dtos.ClinicManualPaymentMethods;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Services.Specifications.ClinicManualPaymentMethods
{
    public class ClinicManualPaymentMethodSpecifications : BaseSpecifications<ClinicManualPaymentMethod, int>
    {
        private ClinicManualPaymentMethodSpecifications() : base()
        {

        }

        public static ClinicManualPaymentMethodSpecifications ByClinic(int clinicId)
        {
            return new ClinicManualPaymentMethodSpecifications
            {
                Criteria = paymentMethod => paymentMethod.ClinicId == clinicId
            };
        }


        public static ClinicManualPaymentMethodSpecifications ByClinicAndTypeAndAccountIdentifier(int clinicId, AddClinicManualPaymentMethodRequest request)
        {

            return new ClinicManualPaymentMethodSpecifications
            {
                Criteria = paymentMethod => paymentMethod.ClinicId == clinicId &&
                                            paymentMethod.Type == request.Type &&
                                            paymentMethod.AccountIdentifier == request.AccountIdentifier
            };
        }


        public static ClinicManualPaymentMethodSpecifications ByClinicAndTypeAndAccountIdentifier(int clinicId, ManualPaymentMethodType type, string paymentIdentifier)
        {

            return new ClinicManualPaymentMethodSpecifications
            {
                Criteria = paymentMethod => paymentMethod.ClinicId == clinicId &&
                                            paymentMethod.Type == type &&
                                            paymentMethod.AccountIdentifier == paymentIdentifier
            };
        }


        public static ClinicManualPaymentMethodSpecifications ActiveByClinic(int clinicId)
        {
            return new ClinicManualPaymentMethodSpecifications
            {
                Criteria = paymentMethod => paymentMethod.ClinicId == clinicId &&
                                            paymentMethod.IsActive
            };
        }


        public static ClinicManualPaymentMethodSpecifications ByIdWithPayments(int paymentMethodId)
        {
            var specification = new ClinicManualPaymentMethodSpecifications
            {
                Criteria = paymentMethod => paymentMethod.Id == paymentMethodId
            };

            specification.Includes.Add(paymentMethod => paymentMethod.Payments);

            return specification;
        }
    }
}