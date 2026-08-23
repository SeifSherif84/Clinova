using Domain.Contracts;
using Domain.Entities.BusinessEntities;
using Domain.Entities.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Persistence.Data.Contexts;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Persistence.Data.DataSeeding
{
    public class DbInitializer(AppDbContext _context,
                               RoleManager<IdentityRole> _roleManager) : IDbInitializer
    {
        public async Task InitializerAsync()
        {
            var pendingMigrations = await _context.Database.GetPendingMigrationsAsync();
            if (pendingMigrations.Any())
                await _context.Database.MigrateAsync();


            var seedDataPath = Path.Combine(
                AppContext.BaseDirectory,
                "Data",
                "DataSeeding");

            if (!await _context.MedicalSpecialties.AnyAsync())
            {
                var medicalSpecialtiesPath = Path.Combine(seedDataPath, "medicalSpecialties.json");
                var medicalSpecialtiesJsonString = await File.ReadAllTextAsync(medicalSpecialtiesPath);
                var medicalSpecialtiesList = JsonSerializer.Deserialize<List<MedicalSpecialty>>(medicalSpecialtiesJsonString);
                if(medicalSpecialtiesList != null && medicalSpecialtiesList.Any())
                    await _context.MedicalSpecialties.AddRangeAsync(medicalSpecialtiesList);
            }

            if (!await _context.Governorates.AnyAsync())
            {
                var governoratesPath = Path.Combine(seedDataPath, "governorates.json");
                var governoratesJsonString = await File.ReadAllTextAsync(governoratesPath);
                var governoratesList = JsonSerializer.Deserialize<List<Governorate>>(governoratesJsonString);
                if (governoratesList != null && governoratesList.Any())
                    await _context.Governorates.AddRangeAsync(governoratesList);
            }

            if (!await _context.Regions.AnyAsync())
            {
                var regionsPath = Path.Combine(seedDataPath, "regions.json");
                var regionsJsonString = await File.ReadAllTextAsync(regionsPath);
                var regionsList = JsonSerializer.Deserialize<List<Region>>(regionsJsonString);
                if (regionsList != null && regionsList.Any())
                    await _context.Regions.AddRangeAsync(regionsList);
            }

            if (!await _context.PaymentMethods.AnyAsync())
            {
                var paymentMethodsPath = Path.Combine(seedDataPath, "paymentMethods.json");
                var paymentMethodsJsonString = await File.ReadAllTextAsync(paymentMethodsPath);
                var paymentMethodsList = JsonSerializer.Deserialize<List<PaymentMethod>>(paymentMethodsJsonString);
                if (paymentMethodsList != null && paymentMethodsList.Any())
                    await _context.PaymentMethods.AddRangeAsync(paymentMethodsList);
            }


            if (!await _context.Roles.AnyAsync())
            {
                var RolesList = new List<IdentityRole>
                {
                    new IdentityRole("Admin"),
                    new IdentityRole("Doctor"),
                    new IdentityRole("Patient"),
                    new IdentityRole("Secretary")
                };
                foreach (var role in RolesList)
                {
                    await _roleManager.CreateAsync(role);
                }
            }

            await _context.SaveChangesAsync();
        }
    }
}
