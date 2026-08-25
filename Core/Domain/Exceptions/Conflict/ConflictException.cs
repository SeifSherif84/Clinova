using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Exceptions.AlreadyExist
{
    public class ConflictException(string message) : Exception(message)
    {
    }
}
