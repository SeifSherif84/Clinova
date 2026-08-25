using Microsoft.Extensions.Options;
using MimeKit;
using MailKit.Net.Smtp;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;

namespace Services.MailKitFeature
{
    public class MailService(IOptions<MailKitSetting> mailKitOption) : IMailService
    {
        public bool SendMail(Email email)
        {
            var mailKitSetting = mailKitOption.Value;

            try
            {
                var mimeMessage = new MimeMessage();
                mimeMessage.From.Add(new MailboxAddress(mailKitSetting.DisplayName, mailKitSetting.Email));
                mimeMessage.To.Add(MailboxAddress.Parse(email.To));  
                mimeMessage.Subject = email.Subject;

                var bodyBuilder = new BodyBuilder();
                bodyBuilder.HtmlBody = email.Body;
                mimeMessage.Body = bodyBuilder.ToMessageBody();

                using var smptClient = new MailKit.Net.Smtp.SmtpClient();
                smptClient.Connect(mailKitSetting.Host, mailKitSetting.Port);
                smptClient.Authenticate(mailKitSetting.Email, mailKitSetting.Password);

                smptClient.Send(mimeMessage);
                return true;
            }
            catch (Exception)
            {
                return false;
            }

        }
    }
}
