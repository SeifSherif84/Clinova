using AutoMapper;
using Domain.Entities.BusinessEntities;
using Shared.Dtos.SecretaryInvitations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.AutoMapping.SecretaryInvitations
{
    public class SecretaryNameResolver : IValueResolver<SecretaryInvitation, SentSecretaryInvitationResponse, string>
    {
        public string Resolve(SecretaryInvitation source, SentSecretaryInvitationResponse destination, string destMember, ResolutionContext context)
        {
            if(source.SecretaryReceiver is null)
                return "Secretary has not registered yet.";

            destMember = $"{source.SecretaryReceiver.FirstName} {source.SecretaryReceiver.LastName}";
            return destMember;
        }
    }
}
