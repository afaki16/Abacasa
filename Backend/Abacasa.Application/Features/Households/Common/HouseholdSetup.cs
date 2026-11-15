using Abacasa.Application.Common.Localization;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;

namespace Abacasa.Application.Features.Households.Common;

// Yeni hane: hane, kullanıcının yönetici üyeliği, kullanıcı adına "Kendisi" kişisi ve varsayılan kategoriler.
// Oturumun aktif hanesi farklı (ya da hiç yok) olabileceği için yeni hanenin kayıtları UseTenant kapsamında eklenir:
// ApplyTenantRules TenantId'yi token'daki hane yerine yeni haneye atar. Transaction çağırana aittir.
// Kategori adları ve "Kendisi" yakınlığı isteğin diline göre yazılır (sonradan değişmez, kullanıcı verisidir).
public static class HouseholdSetup
{
    // Varsayılan kategori anahtarı ve ikonu (CategoryIcons)
    private static readonly (string Key, string Icon)[] DefaultCategories =
    {
        ("market", "shopping-cart"), ("food", "restaurant"), ("transport", "directions-bus"), ("fuel", "local-gas-station"),
        ("bills", "receipt"), ("subscriptions", "smartphone"), ("housing", "home"), ("health", "medical-services"),
        ("education", "school"), ("clothing", "checkroom"), ("personalCare", "spa"), ("homeGoods", "build"),
        ("vehicle", "directions-car"), ("entertainment", "celebration"), ("other", "category")
    };

    public static async Task<Tenant> CreateAsync(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer, User user, string name)
    {
        // Hane ITenantScoped değil; Id'si kaydedince belli olur
        var tenant = new Tenant
        {
            Name = name,
            Domain = null,
            Description = string.Empty,
            ContactEmail = string.Empty,
            ContactPhone = string.Empty,
            IsActive = true,
            // Bağış hedefleri ve emanetler modülü yeni hanede kapalı
            DonationExtrasEnabled = false
        };
        await unitOfWork.Tenants.AddAsync(tenant);
        await unitOfWork.SaveChangesAsync();

        // Bu kapsamda hane verisinin TenantId'si oturumun hanesi değil yeni hane olur (atama ve filtre)
        using (unitOfWork.UseTenant(tenant.Id))
        {
            var person = new Person { TenantId = tenant.Id, Name = user.FullName, Relation = localizer["household.defaults.selfRelation"] };
            await unitOfWork.People.AddAsync(person);

            var membership = new TenantMembership { UserId = user.Id, TenantId = tenant.Id, Role = HouseholdRole.Admin };
            membership.AssignPerson(person);
            await unitOfWork.TenantMemberships.AddAsync(membership);

            foreach (var (key, icon) in DefaultCategories)
                await unitOfWork.Categories.AddAsync(new Category { TenantId = tenant.Id, Name = localizer[$"household.defaults.categories.{key}"], Icon = icon });

            await unitOfWork.SaveChangesAsync();
        }

        return tenant;
    }
}
