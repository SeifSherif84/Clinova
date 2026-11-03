using Domain.Entities.Common;
using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.BusinessEntities
{
    public class AppointmentSlot : BaseEntity<int>
    {
        public DateOnly Date { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public SlotStatus Status { get; set; } = SlotStatus.Available;

        public int? WorkingHourId { get; set; }
        public WorkingHour? WorkingHour { get; set; }


        // Snapshot of the doctor and clinic this slot belongs to.
        // These values remain available even after the WorkingHour is deleted in case when WorkingHour is deleted or deactivated, the booked and reserved can't deleted then we want to keep the doctor and clinic information for the booked and reserved slots after deletion of the WorkingHour.
        public string DoctorId { get; set; } = null!;
        public Doctor Doctor { get; set; } = null!;

        public int ClinicId { get; set; }
        public Clinic Clinic { get; set; } = null!;


        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    }
}
