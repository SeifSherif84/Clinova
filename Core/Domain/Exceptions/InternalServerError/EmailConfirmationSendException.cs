using Domain.Exceptions.BadRequest;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Exceptions.InternalServerError
{
    public class EmailConfirmationSendException(string message) : InternalServerErrorException(message)
    {
    }
}
