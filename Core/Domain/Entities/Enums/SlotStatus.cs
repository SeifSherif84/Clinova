using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.Enums
{
    public enum SlotStatus
    {
        Available = 1,
        Booked,
        Reserved,
        Cancelled
    }
}
