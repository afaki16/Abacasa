using Abacasa.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Abacasa.Domain.Common.Interfaces.Repositories;

// Davet hane verisidir: sorgular aktif haneye filtrelenir. Yalnızca token ile arama hane filtresi dışındadır.
public interface IHouseholdInvitationRepository : IRepository<HouseholdInvitation, int>
{
    // Aktif hanenin davetleri kişi ve davet edenle; sıralama çağırana kalır
    Task<List<HouseholdInvitation>> GetListReadOnlyAsync();

    // Aktif hanenin davetinde kişi bilgisiyle
    Task<HouseholdInvitation?> GetWithPersonAsync(int id);

    // Token sahibi için: hane filtresi dışında, hane ve davet edenle (silinmiş davet dönmez)
    Task<HouseholdInvitation?> GetByTokenHashAsync(string tokenHash);

    // Aktif hanede bu e-postaya bekleyen (kabul/iptal edilmemiş, süresi dolmamış) davet var mı
    Task<bool> HasPendingForEmailAsync(string email, DateTime utcNow);

    // Kişi aktif hanede bekleyen bir davette kullanılıyor mu
    Task<bool> IsPersonInPendingInvitationAsync(int personId, DateTime utcNow, int? excludeInvitationId = null);
}
