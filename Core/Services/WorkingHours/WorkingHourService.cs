using AutoMapper;
using Domain.Contracts;
using Domain.Entities.BusinessEntities;
using Domain.Exceptions.BadRequest;
using Domain.Exceptions.Forbidden;
using Domain.Exceptions.InternalServerError;
using Domain.Exceptions.NotFound;
using Services.Abstractions.AppointmentSlots;
using Services.Abstractions.WorkingHours;
using Services.Clinics;
using Services.Commen;
using Services.Specifications.WorkingHours;
using Shared.Dtos.WorkingHours;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.WorkingHours
{
    public class WorkingHourService(IUnitOfWork _unitOfWork,
                                    IMapper _mapper,
                                    IAppointmentSlotService _appointmentSlotService) : IWorkingHourService
    {
        public async Task<string> CreateWorkingHoursAsync(string userId, int clinicId, CreateWorkingHourRequest request)
        {
            var doctorClinicAccess = await GetDoctorClinicAccessAsync(userId, clinicId);

            if (request.EndTime <= request.StartTime)
                throw new BadRequestException("Please choose an end time that's later than the start time.");

            if (request.SlotDurationMinutes <= 0)
                throw new BadRequestException("Please choose a valid Slot duration.");

            var workingHourRepo = _unitOfWork.GetRepository<WorkingHour, int>();

            var workingHourSpec = new WorkingHoursSpecifications(doctorClinicAccess.Doctor.Id, doctorClinicAccess.Clinic.Id, request.Day);
            var ExistingworkingHour = await workingHourRepo.GetByIdAsync(workingHourSpec);
            if (ExistingworkingHour is not null)
                throw new BadRequestException("You already have working hours set for this day. You can update them instead.");


            var workingHour = _mapper.Map<WorkingHour>(request);
            workingHour.DoctorId = doctorClinicAccess.Doctor.Id;
            workingHour.ClinicId = doctorClinicAccess.Clinic.Id;
            workingHour.IsActive = true;
            await workingHourRepo.AddAsync(workingHour);

            await _appointmentSlotService.GenerateAppointmentSlotsAsync(workingHour);

            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException
                    ("An error occurred while creating working hours right now. Please try again later.");

            return "Your working hours have been saved successfully.";
        }


        public async Task<string> UpdateWorkingHoursAsync(string userId, int workingHourId, int clinicId, UpdateWorkingHourRequest request)
        {
            if (request.StartTime is null && request.EndTime is null && request.SlotDurationMinutes is null)
                return "Please provide at least one working hour field to update.";

            await GetDoctorClinicAccessAsync(userId, clinicId);

            var ExistingworkingHour = await _unitOfWork.GetRepository<WorkingHour, int>().GetByIdAsync(workingHourId);

            if (ExistingworkingHour is null)
                throw new NotFoundException("We couldn't find your working hours for this clinic.");

            if (ExistingworkingHour.DoctorId != userId)
                throw new ResourceAccessDeniedException("You don't have access to update these working hours.");

            if (ExistingworkingHour.ClinicId != clinicId)
                throw new BadRequestException("The working hours you are trying to update do not belong to this clinic.");

            if (request.EndTime is not null && request.StartTime is not null && request.EndTime <= request.StartTime)
                throw new BadRequestException("Please choose an end time that's later than the start time.");

            if (request.EndTime is not null && request.StartTime is null && request.EndTime <= ExistingworkingHour.StartTime)
                throw new BadRequestException("Please choose an end time that's later than the start time.");

            if (request.StartTime is not null && request.EndTime is null && ExistingworkingHour.EndTime <= request.StartTime)
                throw new BadRequestException("Please choose an end time that's later than the start time.");

            if (request.SlotDurationMinutes is not null && request.SlotDurationMinutes <= 0)
                throw new BadRequestException("Please choose a valid Slot duration.");


            var hasChanges = (request.StartTime.HasValue && request.StartTime.Value != ExistingworkingHour.StartTime)
                          || (request.EndTime.HasValue && request.EndTime.Value != ExistingworkingHour.EndTime)
                          || (request.SlotDurationMinutes.HasValue && request.SlotDurationMinutes.Value != ExistingworkingHour.SlotDurationMinutes);

            if (!hasChanges)
                return "Your working hours are already up to date.";



            if (request.StartTime.HasValue)
                ExistingworkingHour.StartTime = request.StartTime.Value;

            if (request.EndTime.HasValue)
                ExistingworkingHour.EndTime = request.EndTime.Value;

            if (request.SlotDurationMinutes.HasValue)
                ExistingworkingHour.SlotDurationMinutes = request.SlotDurationMinutes.Value;

            await _appointmentSlotService.ReconcileAppointmentSlotsAsync(ExistingworkingHour);

            int result = await _unitOfWork.SaveChangesAsync();
            if(result == 0)
                throw new InternalServerErrorException("An error occurred while updating your working hours right now. Please try again later.");

            return "Your working hours have been updated successfully.";
        }


        public async Task<IEnumerable<WorkingHoursResponse>> GetWorkingHoursAsync(string userId, int clinicId)
        {
            await GetDoctorClinicAccessAsync(userId, clinicId);

            var workingHoursSpec = new WorkingHoursSpecifications(userId, clinicId);
            var workingHours = await _unitOfWork.GetRepository<WorkingHour, int>().GetAllAsync(workingHoursSpec);
            if (workingHours is null || !workingHours.Any())
                return Enumerable.Empty<WorkingHoursResponse>();

            return _mapper.Map<IEnumerable<WorkingHoursResponse>>(workingHours);
        }


        public async Task<string> DeleteWorkingHoursAsync(string userId, int workingHourId, int clinicId)
        {
            await GetDoctorClinicAccessAsync(userId, clinicId);

            var ExistingworkingHour = await _unitOfWork.GetRepository<WorkingHour, int>().GetByIdAsync(workingHourId);

            if (ExistingworkingHour is null)
                throw new NotFoundException("We couldn't find your working hours for this clinic.");

            if (ExistingworkingHour.DoctorId != userId)
                throw new ResourceAccessDeniedException("You don't have access to delete these working hours.");

            if (ExistingworkingHour.ClinicId != clinicId)
                throw new BadRequestException("The working hours you are trying to delete do not belong to this clinic.");


            await _appointmentSlotService.DeleteAvailableAppointmentSlotsAsync(ExistingworkingHour); 

            _unitOfWork.GetRepository<WorkingHour, int>().Delete(ExistingworkingHour);
            var result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException("An error occurred while deleting your working hours right now. Please try again later.");

            return "Your working hours have been deleted successfully.";
        }


        public async Task<string> ActivateWorkingHourAsync(string userId, int workingHourId, int clinicId)
        {
            await GetDoctorClinicAccessAsync(userId, clinicId);

            var ExistingworkingHour = await _unitOfWork.GetRepository<WorkingHour, int>().GetByIdAsync(workingHourId);

            if (ExistingworkingHour is null)
                throw new NotFoundException("We couldn't find your working hours for this clinic.");

            if (ExistingworkingHour.DoctorId != userId)
                throw new ResourceAccessDeniedException("You don't have access to update these working hours.");

            if (ExistingworkingHour.ClinicId != clinicId)
                throw new BadRequestException("The working hours you are trying to activate do not belong to this clinic.");

            if (ExistingworkingHour.IsActive)
                return "These working hours are already active.";

            ExistingworkingHour.IsActive = true;

            await _appointmentSlotService.GenerateAppointmentSlotsAsync(ExistingworkingHour);

            int result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException(
                    "An error occurred while activating these working hours.");

            return "Your working hours have been activated successfully.";
        }


        public async Task<string> DeactivateWorkingHourAsync(string userId, int workingHourId, int clinicId)
        {
            await GetDoctorClinicAccessAsync(userId, clinicId);

            var ExistingworkingHour = await _unitOfWork.GetRepository<WorkingHour, int>().GetByIdAsync(workingHourId);

            if (ExistingworkingHour is null)
                throw new NotFoundException("We couldn't find your working hours for this clinic.");

            if (ExistingworkingHour.DoctorId != userId)
                throw new ResourceAccessDeniedException("You don't have access to update these working hours.");

            if (ExistingworkingHour.ClinicId != clinicId)
                throw new BadRequestException("The working hours you are trying to deactivate do not belong to this clinic.");

            if (!ExistingworkingHour.IsActive)
                return "These working hours are already inactive.";

            ExistingworkingHour.IsActive = false;

            await _appointmentSlotService.DeleteFutureAvailableSlotsAsync(ExistingworkingHour);

            int result = await _unitOfWork.SaveChangesAsync();
            if (result == 0)
                throw new InternalServerErrorException(
                    "An error occurred while deactivating these working hours.");

            return "Your working hours have been deactivated successfully.";
        }


        private async Task<DoctorClinicContext> GetDoctorClinicAccessAsync(string userId, int clinicId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new BadRequestException("We couldn't identify your account.");


            var doctor = await _unitOfWork.GetRepository<Doctor, string>().GetByIdAsync(userId);
            if (doctor is null)
                throw new NotFoundException("We couldn't find your account.");


            var clinic = await _unitOfWork.GetRepository<Clinic, int>().GetByIdAsync(clinicId);
            if (clinic is null)
                throw new NotFoundException("The clinic you are trying to access does not exist.");


            var doctorClinic = await _unitOfWork.GetRepository<DoctorClinic>().GetByCompositeKeyAsync(doctor.Id, clinic.Id);
            if (doctorClinic is null)
                throw new ResourceAccessDeniedException("You don't have access to this clinic.");


            return new DoctorClinicContext
            {
                Doctor = doctor,
                Clinic = clinic,
                DoctorClinic = doctorClinic,
                IsOwner = doctorClinic.IsOwner,
            };
        }

    }
}
