using Domain.Contracts;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Domain.Exceptions.BadRequest;
using Domain.Exceptions.InternalServerError;
using Microsoft.Extensions.Configuration;
using Services.Abstractions.AppointmentSlots;
using Services.Specifications.AppointmentSlots;
using Shared.Dtos.WorkingHours;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace Services.AppointmentSlots
{
    public class AppointmentSlotService(IUnitOfWork _unitOfWork, IConfiguration _configuration) : IAppointmentSlotService
    {
        public async Task GenerateAppointmentSlotsAsync(WorkingHour workingHour)
        {
            if (!workingHour.IsActive)
                return;

            var workingPeriod = workingHour.EndTime - workingHour.StartTime;
            var workingPeriodMinutes = Convert.ToInt32(workingPeriod.TotalMinutes);
            var numberOfSlots = workingPeriodMinutes / workingHour.SlotDurationMinutes;
            if (numberOfSlots == 0)
                throw new BadRequestException(
                    "The working hours are too short to create at least one appointment slot.");


            var slotGenerationDays = Convert.ToInt32(_configuration["SlotGenerationDays"]);

            var todayDate = DateOnly.FromDateTime(DateTime.UtcNow);
            var currentTime = TimeOnly.FromDateTime(DateTime.UtcNow);
            var endDate = todayDate.AddDays(slotGenerationDays);

            var appointmentSlotRepo = _unitOfWork.GetRepository<AppointmentSlot, int>();

            var appointmentSlotSpec = new AppointmentSlotSpecifications(workingHour.Id);
            var existingSlots = await appointmentSlotRepo.GetAllAsync(appointmentSlotSpec);

            var bookedSlots = existingSlots.Where(slot => slot.Status == SlotStatus.Booked).ToList();


            for (var currentDate = todayDate; currentDate <= endDate; currentDate = currentDate.AddDays(1))
            {
                if (currentDate.DayOfWeek != workingHour.Day)
                    continue;

                var slotStartTime = workingHour.StartTime;

                for (int i = 0; i < numberOfSlots; i++)
                {
                    var slotEndTime = slotStartTime.AddMinutes(workingHour.SlotDurationMinutes);

                    // Skip slots that have already ended today.
                    // Past slots should not be generated again.
                    if (currentDate == todayDate && slotEndTime <= currentTime)
                    {
                        slotStartTime = slotEndTime;
                        continue;
                    }

                    var slotAlreadyExists = existingSlots.Any(slot =>
                        slot.Date == currentDate &&
                        slot.StartTime == slotStartTime &&
                        slot.EndTime == slotEndTime);


                    // Check whether a booked slot already occupies
                    // or overlaps this time period.
                    var hasBookedConflict = bookedSlots.Any(slot =>
                        slot.Date == currentDate &&
                        slot.StartTime < slotEndTime &&
                        slot.EndTime > slotStartTime);


                    // Only create an Available slot if it does not
                    // conflict with an existing booked slot.
                    if (!hasBookedConflict && !slotAlreadyExists)
                    {
                        var slot = new AppointmentSlot()
                        {
                            Date = currentDate,
                            StartTime = slotStartTime,
                            EndTime = slotEndTime,
                            Status = SlotStatus.Available,
                            WorkingHour = workingHour,
                            DoctorId = workingHour.DoctorId,
                            ClinicId = workingHour.ClinicId
                        };

                        await appointmentSlotRepo.AddAsync(slot);
                    }

                    // Move the start time to the end of the current slot
                    // to calculate the next slot.
                    slotStartTime = slotEndTime;
                }
            }
        }


        public async Task ReconcileAppointmentSlotsAsync(WorkingHour workingHour)
        {
            await DeleteFutureAvailableSlotsAsync(workingHour);

            await GenerateAppointmentSlotsAsync(workingHour);
        }


        public async Task DeleteAvailableAppointmentSlotsAsync(WorkingHour workingHour)
        {
            var appointmentSlotRepo = _unitOfWork.GetRepository<AppointmentSlot, int>();

            var appointmentSlotSpec = new AppointmentSlotSpecifications(workingHour.Id, SlotStatus.Available);
            var availableSlots = await appointmentSlotRepo.GetAllAsync(appointmentSlotSpec);

            foreach (var slot in availableSlots)
            {
                appointmentSlotRepo.Delete(slot);
            }
        }


        public async Task DeleteFutureAvailableSlotsAsync(WorkingHour workingHour)
        {
            var appointmentSlotRepo = _unitOfWork.GetRepository<AppointmentSlot, int>();

            var todayDate = DateOnly.FromDateTime(DateTime.UtcNow);
            var currentTime = TimeOnly.FromDateTime(DateTime.UtcNow);

            var appointmentSlotSpec = new AppointmentSlotSpecifications(workingHour.Id,
                                                                        SlotStatus.Available, 
                                                                        todayDate, 
                                                                        currentTime);

            var futureAvailableSlots = await appointmentSlotRepo.GetAllAsync(appointmentSlotSpec);

            foreach (var slot in futureAvailableSlots)
            {
                appointmentSlotRepo.Delete(slot);
            }
        }

    }
}
