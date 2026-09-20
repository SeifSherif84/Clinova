using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos.Paymob
{
    public class PaymobItem
    {
        public string Name { get; set; } = null!;
        public int Amount { get; set; }
        public int Quantity { get; set; } = 1;
        public string? Description { get; set; }
    }
}
