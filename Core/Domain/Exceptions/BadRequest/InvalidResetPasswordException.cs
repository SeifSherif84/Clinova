using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Exceptions.BadRequest
{
    public class InvalidResetPasswordException(IEnumerable<string> errors)
        : BadRequestException(string.Join(", ", errors))
    {
    }
}
