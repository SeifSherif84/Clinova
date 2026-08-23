using Domain.Entities.BusinessEntities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Persistence.Data.Configurations
{
    public class NotificationConfig : IEntityTypeConfiguration<Notification>
    {
        public void Configure(EntityTypeBuilder<Notification> builder)
        {
            builder.HasKey(noti => noti.Id);

            builder.Property(noti => noti.Id).UseIdentityColumn(1, 1);

            builder.HasOne(noti => noti.UserApp)
                   .WithMany(userApp => userApp.Notifications)
                   .HasForeignKey(noti => noti.UserAppId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
