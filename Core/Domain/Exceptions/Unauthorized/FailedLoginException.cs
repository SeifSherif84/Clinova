using Domain.Exceptions.BadRequest;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Exceptions.Unauthorized
{
    public class FailedLoginException(string message) : BadRequestException(message)
    { 
    }
}
