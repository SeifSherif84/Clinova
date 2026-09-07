using Shared.Dtos.WorkingHours;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.WorkingHours
{
    public interface IWorkingHourService
    {
        Task<string> CreateWorkingHoursAsync(string userId, int clinicId, CreateWorkingHourRequest request);
        Task<string> UpdateWorkingHoursAsync(string userId, int workingHourId, int clinicId, UpdateWorkingHourRequest request);
        Task<string> DeleteWorkingHoursAsync(string userId, int workingHourId, int clinicId);
        Task<IEnumerable<WorkingHoursResponse>> GetWorkingHoursAsync(string userId, int clinicId);
        Task<string> ActivateWorkingHourAsync(string userId, int workingHourId, int clinicId);
        Task<string> DeactivateWorkingHourAsync(string userId, int workingHourId, int clinicId);
    }
}
