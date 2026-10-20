using Domain.Entities.BusinessEntities;
using Shared.Dtos.AppointmentSlots;
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



        Task<IEnumerable<DoctorDaysWhichHaveAvailableSlotResponse>> GetDoctorDaysWhichHaveAvailableSlotForPatientAppointmentAsync(string userId, string doctorId, int clinicId, DoctorDaysWhichHaveAvailableSlotRequest request);
        Task<IEnumerable<AvailableAppointmentSlotsExistInSpecificDateResponse>> GetAvailableAppointmentSlotsExistInSpecificDayForPatientAppointmentAsync(string userId, string doctorId, int clinicId, DoctorAvailableAppointmentSlotsExistInSpecificDayRequest request);

        Task<IEnumerable<DoctorDaysWhichHaveAvailableSlotResponse>> GetDoctorDaysWhichHaveAvailableSlotForGuestReservationAsync(string userId, string doctorId, DoctorDaysWhichHaveAvailableSlotRequest request);
        Task<IEnumerable<AvailableAppointmentSlotsExistInSpecificDateResponse>> GetAvailableAppointmentSlotsExistInSpecificDayForGuestReservationAsync(string userId, string doctorId, DoctorAvailableAppointmentSlotsExistInSpecificDayRequest request);



        Task<IEnumerable<DoctorDaysWhichHaveAvailableSlotResponse>> GetDoctorDaysWhichHaveAvailableSlotForPatientRescheduleAsync(string userId, int appointmentId, DoctorDaysWhichHaveAvailableSlotRequest request);
        Task<IEnumerable<AvailableAppointmentSlotsExistInSpecificDateResponse>> GetAvailableAppointmentSlotsExistInSpecificDayForPatientRescheduleAsync(string userId, int appointmentId, DoctorAvailableAppointmentSlotsExistInSpecificDayRequest request);

        Task<IEnumerable<DoctorDaysWhichHaveAvailableSlotResponse>> GetDoctorDaysWhichHaveAvailableSlotForSecretaryRescheduleAsync(string userId, int appointmentId, DoctorDaysWhichHaveAvailableSlotRequest request);
        Task<IEnumerable<AvailableAppointmentSlotsExistInSpecificDateResponse>> GetAvailableAppointmentSlotsExistInSpecificDayForSecretaryRescheduleAsync(string userId, int appointmentId, DoctorAvailableAppointmentSlotsExistInSpecificDayRequest request);
    }
}
