using Abacasa.Domain.Common.Enums;
using System;

namespace Abacasa.Domain.Entities;

// Kullanıcının bir haneye üyeliği. Hane kaynaklarının izinleri yalnızca aktif hanedeki üyelik rolünden gelir.
// ITenantScoped değildir: kullanıcı kendi bütün üyeliklerini (her hane için) görebilmelidir; yalnızca soft-delete filtresi uygulanır.
public class TenantMembership : BaseAuditableEntity
{
    public int UserId { get; set; }
    public User User { get; set; }

    public int TenantId { get; set; }
    public Tenant Tenant { get; set; }

    public HouseholdRole Role { get; set; }

    // Hanedeki kişi kaydı (People); kişi aynı haneye ait olmalı
    public int? PersonId { get; set; }
    public Person? Person { get; set; }

    /// Kişiyi üyeliğe bağlar; kişinin hanesi üyeliğin hanesiyle aynı olmalı
    public void AssignPerson(Person person)
    {
        if (person.TenantId != TenantId)
            throw new InvalidOperationException("Üyeliğe bağlanan kişi aynı haneye ait olmalı.");

        PersonId = person.Id == 0 ? null : person.Id;
        Person = person;
    }
}
