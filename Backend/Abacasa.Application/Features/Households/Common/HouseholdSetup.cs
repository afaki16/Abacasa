using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;

namespace Abacasa.Application.Features.Households.Common;

// Yeni hane: hane, kullanıcının yönetici üyeliği, kullanıcı adına "Kendisi" kişisi ve varsayılan kategoriler.
// Oturumun aktif hanesi farklı (ya da hiç yok) olabileceği için yeni hanenin kayıtları UseTenant kapsamında eklenir:
// ApplyTenantRules TenantId'yi token'daki hane yerine yeni haneye atar. Transaction çağırana aittir.
public static class HouseholdSetup
{
    private static readonly string[] DefaultCategories =
    {
        "Market", "Yemek", "Ulaşım", "Benzin", "Faturalar", "Abonelikler", "Konut", "Sağlık", "Eğitim",
        "Giyim", "Kişisel bakım", "Ev eşyası", "Araç", "Eğlence", "Diğer"
    };

    public static async Task<Tenant> CreateAsync(IUnitOfWork unitOfWork, User user, string name)
    {
        // Hane ITenantScoped değil; Id'si kaydedince belli olur
        var tenant = new Tenant
        {
            Name = name,
            Domain = null,
            Description = string.Empty,
            ContactEmail = string.Empty,
            ContactPhone = string.Empty,
            IsActive = true
        };
        await unitOfWork.Tenants.AddAsync(tenant);
        await unitOfWork.SaveChangesAsync();

        // Bu kapsamda hane verisinin TenantId'si oturumun hanesi değil yeni hane olur (atama ve filtre)
        using (unitOfWork.UseTenant(tenant.Id))
        {
            var person = new Person { TenantId = tenant.Id, Name = user.FullName, Relation = "Kendisi" };
            await unitOfWork.People.AddAsync(person);

            var membership = new TenantMembership { UserId = user.Id, TenantId = tenant.Id, Role = HouseholdRole.Admin };
            membership.AssignPerson(person);
            await unitOfWork.TenantMemberships.AddAsync(membership);

            foreach (var categoryName in DefaultCategories)
                await unitOfWork.Categories.AddAsync(new Category { TenantId = tenant.Id, Name = categoryName });

            await unitOfWork.SaveChangesAsync();
        }

        return tenant;
    }
}
