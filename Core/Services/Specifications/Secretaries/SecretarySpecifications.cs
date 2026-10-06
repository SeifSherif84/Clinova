using Domain.Entities.BusinessEntities;
using Services.Specifications.SecretaryInvitations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Specifications.Secretaries
{
    public class SecretarySpecifications : BaseSpecifications<Secretary, string>
    {
        public SecretarySpecifications() : base()
        {

        }

        public static SecretarySpecifications GetSecretariesByClinicId(int clinicId)
        {
            var specifications = new SecretarySpecifications
            {
                Criteria = secretary => secretary.ClinicId == clinicId
            };
            return specifications;
        }

    }
}
