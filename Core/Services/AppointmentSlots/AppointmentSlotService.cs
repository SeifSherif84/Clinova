using AutoMapper;
using Domain.Contracts;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Enums;
using Domain.Exceptions.BadRequest;
using Domain.Exceptions.Forbidden;
using Domain.Exceptions.InternalServerError;
using Domain.Exceptions.NotFound;
using Microsoft.Extensions.Configuration;
using Services.Abstractions.AppointmentSlots;
using Services.Commen;
using Services.Specifications.Appointments;
using Services.Specifications.AppointmentSlots;
using Shared.Dtos.AppointmentSlots;
using Shared.Dtos.WorkingHours;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace Services.AppointmentSlots
{
    public class AppointmentSlotService(IUnitOfWork _unitOfWork, 
                                        IConfiguration _configuration) : IAppointmentSlotService
    {
        public async Task GenerateAppointmentSlotsAsync(WorkingHour workingHour, List<int> deletedSlotIds)
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
            var existingSlots = (await appointmentSlotRepo.GetAllAsync(appointmentSlotSpec))
                                                          .Where(slot => !deletedSlotIds.Contains(slot.Id))
                                                          .ToList();
                                                       

            var occupiedSlots = existingSlots
                .Where(slot => slot.Status is SlotStatus.Booked or SlotStatus.Reserved)
                .ToList();


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
                    var hasOccupiedConflict = occupiedSlots.Any(slot =>
                        slot.Date == currentDate &&
                        slot.StartTime < slotEndTime &&
                        slot.EndTime > slotStartTime);


                    // Only create an Available slot if it does not
                    // conflict with an existing booked slot.
                    if (!hasOccupiedConflict && !slotAlreadyExists)
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
            List<int> deletedSlotIds =  await DeleteFutureAvailableSlotsAsync(workingHour);

            await GenerateAppointmentSlotsAsync(workingHour, deletedSlotIds);
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


        public async Task<List<int>> DeleteFutureAvailableSlotsAsync(WorkingHour workingHour)
        {
            var appointmentSlotRepo = _unitOfWork.GetRepository<AppointmentSlot, int>();

            var todayDate = DateOnly.FromDateTime(DateTime.UtcNow);
            var currentTime = TimeOnly.FromDateTime(DateTime.UtcNow);

            var appointmentSlotSpec = new AppointmentSlotSpecifications(workingHour.Id,
                                                                        SlotStatus.Available, 
                                                                        todayDate, 
                                                                        currentTime);

            var futureAvailableSlots = await appointmentSlotRepo.GetAllAsync(appointmentSlotSpec);

            List<int> deletedSlotIds = new List<int>();

            foreach (var slot in futureAvailableSlots)
            {
                appointmentSlotRepo.Delete(slot);
                deletedSlotIds.Add(slot.Id);
            }

            return deletedSlotIds;
        }




        public async Task<IEnumerable<DoctorDaysWhichHaveAvailableSlotResponse>> GetDoctorDaysWhichHaveAvailableSlotForPatientAppointmentAsync(string userId, string doctorId, 
                                                                                                                                               int clinicId,
                                                                                                                                               DoctorDaysWhichHaveAvailableSlotRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var patient = await _unitOfWork.GetRepository<Patient, string>().GetByIdAsync(userId);
            if (patient is null)
                throw new NotFoundException("We couldn't find your account.");

            ValidateDateRange(request.From, request.To);

            await GetDoctorClinicAccessAsync(doctorId, clinicId);

            return await GetDoctorAvailableDaysAsync(clinicId, doctorId, request.From!.Value, request.To!.Value);
        }

        public async Task<IEnumerable<AvailableAppointmentSlotsExistInSpecificDateResponse>> GetAvailableAppointmentSlotsExistInSpecificDayForPatientAppointmentAsync(string userId, string doctorId,
                                                                                                                                                                      int clinicId,
                                                                                                                                                                      DoctorAvailableAppointmentSlotsExistInSpecificDayRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var patient = await _unitOfWork.GetRepository<Patient, string>().GetByIdAsync(userId);
            if (patient is null)
                throw new NotFoundException("We couldn't find your account.");

            if (request.Date is null)
                throw new BadRequestException("The date is required.");

            await GetDoctorClinicAccessAsync(doctorId, clinicId);

            return await GetDoctorAvailableSlotsAsync(clinicId, doctorId, request.Date.Value);
        }


        public async Task<IEnumerable<DoctorDaysWhichHaveAvailableSlotResponse>> GetDoctorDaysWhichHaveAvailableSlotForGuestReservationAsync(string userId, string doctorId,
                                                                                                                                             DoctorDaysWhichHaveAvailableSlotRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var secretary = await _unitOfWork.GetRepository<Secretary, string>().GetByIdAsync(userId);
            if (secretary is null)
                throw new NotFoundException("We couldn't find your account.");

            if (secretary.ClinicId is null)
                throw new BadRequestException("You are not assigned to any clinic.");

            int clinicId = secretary.ClinicId.Value;

            ValidateDateRange(request.From, request.To);

            await GetDoctorClinicAccessAsync(doctorId, clinicId);

            return await GetDoctorAvailableDaysAsync(clinicId, doctorId, request.From!.Value, request.To!.Value);
        }

        public async Task<IEnumerable<AvailableAppointmentSlotsExistInSpecificDateResponse>> GetAvailableAppointmentSlotsExistInSpecificDayForGuestReservationAsync(string userId, string doctorId,
                                                                                                                                                                    DoctorAvailableAppointmentSlotsExistInSpecificDayRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var secretaryRepo = _unitOfWork.GetRepository<Secretary, string>();
            var secretary = await secretaryRepo.GetByIdAsync(userId);
            if (secretary is null)
                throw new NotFoundException("We couldn't find your account.");

            if (secretary.ClinicId is null)
                throw new BadRequestException("You are not assigned to any clinic.");

            var clinicId = secretary.ClinicId.Value;

            if (request.Date is null)
                throw new BadRequestException("The date is required.");

            var date = request.Date.Value;

            await GetDoctorClinicAccessAsync(doctorId, clinicId);

            return await GetDoctorAvailableSlotsAsync(clinicId, doctorId, request.Date.Value);
        }





        public async Task<IEnumerable<DoctorDaysWhichHaveAvailableSlotResponse>> GetDoctorDaysWhichHaveAvailableSlotForPatientRescheduleAsync(string userId, int appointmentId,
                                                                                                                                              DoctorDaysWhichHaveAvailableSlotRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var patient = await _unitOfWork.GetRepository<Patient, string>().GetByIdAsync(userId);
            if (patient is null)
                throw new NotFoundException("We couldn't find your account.");

            var appointmentSpec = AppointmentSpecifications.ById(appointmentId);
            var appointment = await _unitOfWork.GetRepository<Appointment, int>().GetByIdAsync(appointmentSpec);

            if (appointment is null)
                throw new NotFoundException("The appointment was not found.");

            if (appointment.PatientId != userId)
                throw new ResourceAccessDeniedException("You are not authorized to reschedule this appointment.");

            if (appointment.AppointmentSlot is null)
                throw new InternalServerErrorException("The slot associated with this appointment could not be found.");

            ValidateDateRange(request.From, request.To);

            CheckReschedulableAppointment(appointment);

            return await GetDoctorAvailableDaysAsync(appointment.AppointmentSlot.ClinicId, appointment.AppointmentSlot.DoctorId, request.From!.Value, request.To!.Value);
        }
        public async Task<IEnumerable<AvailableAppointmentSlotsExistInSpecificDateResponse>> GetAvailableAppointmentSlotsExistInSpecificDayForPatientRescheduleAsync(string userId, int appointmentId, 
                                                                                                                                                                     DoctorAvailableAppointmentSlotsExistInSpecificDayRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var patient = await _unitOfWork.GetRepository<Patient, string>().GetByIdAsync(userId);
            if (patient is null)
                throw new NotFoundException("We couldn't find your account.");

            var appointmentSpec = AppointmentSpecifications.ById(appointmentId);
            var appointment = await _unitOfWork.GetRepository<Appointment, int>().GetByIdAsync(appointmentSpec);

            if (appointment is null)
                throw new NotFoundException("The appointment was not found.");

            if (appointment.PatientId != userId)
                throw new ResourceAccessDeniedException("You are not authorized to reschedule this appointment.");

            if (appointment.AppointmentSlot is null)
                throw new InternalServerErrorException("The slot associated with this appointment could not be found.");

            if (request.Date is null)
                throw new BadRequestException("The date is required.");

            CheckReschedulableAppointment(appointment);

            return await GetDoctorAvailableSlotsAsync(appointment.AppointmentSlot.ClinicId, appointment.AppointmentSlot.DoctorId, request.Date.Value);
        }



        public async Task<IEnumerable<DoctorDaysWhichHaveAvailableSlotResponse>> GetDoctorDaysWhichHaveAvailableSlotForSecretaryRescheduleAsync(string userId, int appointmentId,
                                                                                                                                                DoctorDaysWhichHaveAvailableSlotRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var secretary = await _unitOfWork.GetRepository<Secretary, string>().GetByIdAsync(userId);
            if (secretary is null)
                throw new NotFoundException("We couldn't find your account.");

            var appointmentSpec = AppointmentSpecifications.ById(appointmentId);
            var appointment = await _unitOfWork.GetRepository<Appointment, int>().GetByIdAsync(appointmentSpec);

            if (appointment is null)
                throw new NotFoundException("The appointment was not found.");

            if (secretary.ClinicId is null)
                throw new BadRequestException("You are not assigned to any clinic.");

            int clinicId = secretary.ClinicId.Value;

            if (appointment.AppointmentSlot is null)
                throw new InternalServerErrorException("The slot associated with this appointment could not be found.");

            if (appointment.AppointmentSlot.ClinicId != clinicId)
                throw new ResourceAccessDeniedException("You are not authorized to reschedule appointments outside your clinic.");

            ValidateDateRange(request.From, request.To);

            CheckReschedulableAppointment(appointment);

            return await GetDoctorAvailableDaysAsync(appointment.AppointmentSlot.ClinicId, appointment.AppointmentSlot.DoctorId, request.From!.Value, request.To!.Value);
        }

        public async Task<IEnumerable<AvailableAppointmentSlotsExistInSpecificDateResponse>> GetAvailableAppointmentSlotsExistInSpecificDayForSecretaryRescheduleAsync(string userId, int appointmentId,
                                                                                                                                                                       DoctorAvailableAppointmentSlotsExistInSpecificDayRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");

            var secretary = await _unitOfWork.GetRepository<Secretary, string>().GetByIdAsync(userId);
            if (secretary is null)
                throw new NotFoundException("We couldn't find your account.");

            var appointmentSpec = AppointmentSpecifications.ById(appointmentId);
            var appointment = await _unitOfWork.GetRepository<Appointment, int>().GetByIdAsync(appointmentSpec);

            if (appointment is null)
                throw new NotFoundException("The appointment was not found.");

            if (secretary.ClinicId is null)
                throw new BadRequestException("You are not assigned to any clinic.");

            int clinicId = secretary.ClinicId.Value;

            if (appointment.AppointmentSlot is null)
                throw new InternalServerErrorException("The slot associated with this appointment could not be found.");

            if (appointment.AppointmentSlot.ClinicId != clinicId)
                throw new ResourceAccessDeniedException("You are not authorized to reschedule appointments outside your clinic.");

            if (request.Date is null)
                throw new BadRequestException("The date is required.");

            CheckReschedulableAppointment(appointment);

            return await GetDoctorAvailableSlotsAsync(appointment.AppointmentSlot.ClinicId, appointment.AppointmentSlot.DoctorId, request.Date.Value);
        }




        private void CheckReschedulableAppointment(Appointment appointment)
        {
            var currentSlot = appointment.AppointmentSlot;
            var payment = appointment.DepositPayment;

            if (currentSlot is null)
                throw new InternalServerErrorException("The current appointment slot could not be found.");

            if (payment is null)
                throw new InternalServerErrorException("The payment associated with this appointment could not be found.");

            if (appointment.Status == AppointmentStatus.PendingPayment)
            {
                if (payment.Status != DepositPaymentStatus.Pending)
                    throw new BadRequestException("This appointment cannot be rescheduled with its current payment status.");

                if (appointment.ReservationExpiresAt <= DateTime.UtcNow)
                    throw new BadRequestException("This reservation has expired. Please book another available slot.");

                if (currentSlot.Status != SlotStatus.Reserved)
                    throw new BadRequestException("The current appointment slot is no longer reserved.");
            }
            else if (appointment.Status == AppointmentStatus.Confirmed)
            {
                if (payment.Status != DepositPaymentStatus.Paid)
                    throw new BadRequestException("Only confirmed appointments with completed payment can be rescheduled.");

                if (currentSlot.Status != SlotStatus.Booked)
                    throw new BadRequestException("The current appointment slot is not booked.");
            }
            else
                throw new BadRequestException("This appointment cannot be rescheduled at its current status.");
        }


        private static void ValidateDateRange(DateOnly? from, DateOnly? to)
        {
            if (from is null)
                throw new BadRequestException("The from date is required.");

            if (to is null)
                throw new BadRequestException("The to date is required.");

            if (from.Value > to.Value)
                throw new BadRequestException("The from date cannot be later than the to date.");

            if (to.Value.DayNumber - from.Value.DayNumber > 31)
                throw new BadRequestException("The date range cannot exceed 31 days.");
        }


        private static TimeZoneInfo GetEgyptTimeZone()
        {
            return TimeZoneInfo.FindSystemTimeZoneById(OperatingSystem.IsWindows() ? "Egypt Standard Time" : "Africa/Cairo");
        }


        private async Task<IEnumerable<DoctorDaysWhichHaveAvailableSlotResponse>> GetDoctorAvailableDaysAsync(int clinicId,
                                                                                                              string doctorId,
                                                                                                              DateOnly from,
                                                                                                              DateOnly to)
        {
            var slotRepo = _unitOfWork.GetRepository<AppointmentSlot, int>();
            var specification = new AppointmentSlotSpecifications(clinicId, doctorId, from, to);
            var availableSlots = await slotRepo.GetAllAsync(specification);

            var nowInEgypt = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, GetEgyptTimeZone()); 
            var todayInEgypt = DateOnly.FromDateTime(nowInEgypt);
            var currentTimeInEgypt = TimeOnly.FromDateTime(nowInEgypt);


            var futureAvailableSlots = availableSlots.Where(slot => slot.Date > todayInEgypt || (slot.Date == todayInEgypt && slot.StartTime > currentTimeInEgypt));

            var availableDays = futureAvailableSlots.Select(slot => slot.Date)
                                                    .Distinct()
                                                    .OrderBy(date => date)
                                                    .Select(date => new DoctorDaysWhichHaveAvailableSlotResponse()
                                                    {
                                                        DayName = date.DayOfWeek.ToString(),
                                                        Date = date
                                                    }).ToList();
            return availableDays;
        }

        private async Task<IEnumerable<AvailableAppointmentSlotsExistInSpecificDateResponse>> GetDoctorAvailableSlotsAsync(int clinicId,
                                                                                                                           string doctorId, 
                                                                                                                           DateOnly date)
        {
            var nowInEgypt = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, GetEgyptTimeZone());
            var todayInEgypt = DateOnly.FromDateTime(nowInEgypt);
            var currentTimeInEgypt = TimeOnly.FromDateTime(nowInEgypt);

            if (date < todayInEgypt)
                throw new BadRequestException("The date cannot be in the past.");

            var slotRepo = _unitOfWork.GetRepository<AppointmentSlot, int>();
            var specification = new AppointmentSlotSpecifications(clinicId, doctorId, date);
            var availableSlots = await slotRepo.GetAllAsync(specification);

            var futureAvailableSlots = availableSlots.Where(slot => slot.Date > todayInEgypt || (slot.Date == todayInEgypt && slot.StartTime > currentTimeInEgypt))
                                                     .OrderBy(slot => slot.StartTime);

            return futureAvailableSlots.Select(slot => new AvailableAppointmentSlotsExistInSpecificDateResponse()
            {
                Id = slot.Id,
                StartTime = slot.StartTime,
                EndTime = slot.EndTime
            }).ToList();
        }




        private async Task<DoctorClinicContext> GetDoctorClinicAccessAsync(string doctorId, int clinicId)
        {
            if (string.IsNullOrWhiteSpace(doctorId))
                throw new BadRequestException("Doctor ID is required.");


            var doctorRepo = _unitOfWork.GetRepository<Doctor, string>();
            var doctor = await doctorRepo.GetByIdAsync(doctorId);
            if (doctor is null)
                throw new NotFoundException("The doctor you are trying to access does not exist.");


            var clinicRepo = _unitOfWork.GetRepository<Clinic, int>();
            var clinic = await clinicRepo.GetByIdAsync(clinicId);
            if (clinic is null)
                throw new NotFoundException("The clinic you are trying to access does not exist.");

            var doctorClinicRepo = _unitOfWork.GetRepository<DoctorClinic>();
            var doctorClinic = await doctorClinicRepo.GetByCompositeKeyAsync(doctor.Id, clinic.Id);
            if (doctorClinic is null)
                throw new ResourceAccessDeniedException("This doctor does not belong to this clinic.");

            if (doctor.ApprovalStatus != DoctorApprovalStatus.Approved)
                throw new BadRequestException("This doctor is not currently available for appointments.");

            return new DoctorClinicContext
            {
                Doctor = doctor,
                Clinic = clinic,
                DoctorClinic = doctorClinic,
                IsOwner = doctorClinic.IsOwner
            };
        }


    }
}
