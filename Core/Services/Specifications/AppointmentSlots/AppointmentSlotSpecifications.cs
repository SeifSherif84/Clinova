using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Specifications.AppointmentSlots
{
    public class AppointmentSlotSpecifications : BaseSpecifications<AppointmentSlot, int>
    {
        // constructor to filter appointment slots by working hour id 
        public AppointmentSlotSpecifications(int workinghourId) : base()
        {
            Criteria = slot => slot.WorkingHourId == workinghourId;
        }

        
        public AppointmentSlotSpecifications(int workinghourId, SlotStatus status) : base()
        {
            Criteria = slot => slot.WorkingHourId == workinghourId && slot.Status == status;
        }

        public AppointmentSlotSpecifications(int workinghourId, 
                                             SlotStatus status,
                                             DateOnly todayDate,
                                             TimeOnly currentTime) : base()
        {
            Criteria = slot => slot.WorkingHourId == workinghourId &&
                               slot.Status == status &&
                               ((slot.Date > todayDate) || (slot.Date == todayDate && slot.EndTime > currentTime));
        }

    }
}
