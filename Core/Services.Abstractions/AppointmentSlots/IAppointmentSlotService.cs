using Domain.Entities.BusinessEntities;
using Shared.Dtos.WorkingHours;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.AppointmentSlots
{
    public interface IAppointmentSlotService
    {
        Task GenerateAppointmentSlotsAsync(WorkingHour workingHour);
        Task ReconcileAppointmentSlotsAsync(WorkingHour workingHour);
        Task DeleteAvailableAppointmentSlotsAsync(WorkingHour workingHour);
        Task DeleteFutureAvailableSlotsAsync(WorkingHour workingHour);
    }
}
