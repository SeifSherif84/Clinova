using Services.MailKitFeature;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.MailKitFeature
{
    public interface IMailService
    {
        public bool SendMail(Email email);
    }
}
