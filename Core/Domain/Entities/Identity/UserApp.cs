using Domain.Entities.BusinessEntities;
using Domain.Entities.Contracts;
using Domain.Entities.Enums;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.Identity
{
    public abstract class UserApp : IdentityUser, ISoftDelete
    {
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string? ProfilePicture { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public Gender? Gender { get; set; }
        public string? RefreshToken { get; set; } = null!;
        public DateTime? RefreshTokenExpirationDate { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }

        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    }
}
