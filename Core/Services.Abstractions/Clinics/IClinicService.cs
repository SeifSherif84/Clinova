using Shared.Dtos.Clinics;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Abstractions.Clinics
{
    public interface IClinicService
    {
        Task<string> AddClinicAsync(string userId, AddClinicRequest request);
        Task<string> UpdateClinicAsync(string userId, int clinicId, UpdateClinicRequest request);
        Task<string> AddImageAsync(string userId, int clinicId, AddClinicImagesRequest request);
        Task<string> AddPhoneNumberAsync(string userId, int clinicId, AddClinicPhoneNumberRequest request);
        Task<string> DeleteImageAsync(string userId, int clinicId, int imageId);
        Task<string> DeletePhoneNumberAsync(string userId, int clinicId, int phoneNumberId);
        Task<IEnumerable<ClinicResponse>> GetAllClinicAsync(string userId);
        Task<ClinicDetailsResponse> GetClinicDetailsAsync(string userId, int clinicId);
        Task<string> DeleteClinicAsync(string userId, int clinicId);
        Task<string> RemoveMemberAsync(string userId, int clinicId, string memberId);
        Task<string> LeaveClinicAsync(string userId, int clinicId);
        Task<IEnumerable<ClinicMemberResponse>> GetClinicMembersAsync(string userId, int clinicId);

    }
}
