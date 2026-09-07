using Domain.Entities.BusinessEntities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Specifications.WorkingHours
{
    public class WorkingHoursSpecifications : BaseSpecifications<WorkingHour, int>
    {
        // constructor to get working hours by doctorId, clinicId and day to check if working hours already exist for that doctor, clinic and day
        public WorkingHoursSpecifications(string doctorId, int clinicId, DayOfWeek day) : base()
        {
            Criteria = wh => wh.DoctorId == doctorId && wh.ClinicId == clinicId && wh.Day == day;
        }



        // constructor to get working hours by doctorId and clinicId
        public WorkingHoursSpecifications(string doctorId, int clinicId) : base()
        {
            Criteria = wh => wh.DoctorId == doctorId && wh.ClinicId == clinicId;
        }

    }
}
