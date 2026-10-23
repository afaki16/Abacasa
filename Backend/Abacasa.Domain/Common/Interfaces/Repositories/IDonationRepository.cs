using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Abacasa.Domain.Common.Interfaces.Repositories;

public interface IDonationRepository : IRepository<Donation, int>
{
    // Tenant filtresi ApplicationDbContext'te uygulanır; burada sadece kullanıcının hanesi görünür.
    Task<(IEnumerable<Donation> Donations, int TotalCount)> GetDonationsPagedAsync(
        int page, int pageSize, DonationFilter filter);

    Task<Donation> GetWithRelationsAsync(int id);

    Task<Donation> GetWithRelationsReadOnlyAsync(int id);

    // Özet SQL'de toplanır (GroupBy/Sum)
    Task<(decimal Total, int Count)> GetTotalsAsync(DonationFilter filter);

    Task<List<(DonationKind Kind, decimal Total, int Count)>> GetTotalsByKindAsync(DonationFilter filter);

    // Veren boşsa PersonId ve PersonName null döner (hane)
    Task<List<(int? PersonId, string? PersonName, decimal Total, int Count)>> GetTotalsByGiverAsync(DonationFilter filter);

    // Yemek kartı dahil; ödeme aracı ve verene (GiverPersonId) göre (Özet için)
    Task<List<SpendingTotal>> GetTotalsByPaymentMethodAndPersonAsync(DonationFilter filter);

    // Yıllık tablo; yemek kartı hariç (kaydın gerçek aracı). Plana bağlı kayıtlar vade ayına (RecurringPaymentMonth) göre.
    Task<List<(int RecurringPaymentId, int Month, decimal Total)>> GetPlanMonthTotalsAsync(int year);

    // Yıllık tablo; yemek kartı hariç, plana bağlı ve emanetten dağıtılan olmayanlar, kayıt ayına göre
    Task<List<(int Month, decimal Total)>> GetUnplannedMonthTotalsAsync(int year);

    // Emanetten dağıtılan bağışlar (FundId dolu), listeyle aynı filtrelerle
    Task<(decimal Total, int Count)> GetFundDistributedTotalsAsync(DonationFilter filter);

    // Hedef raporu: yılın bağışları veren kişi ve türe göre; emanetten dağıtılanlar hariç.
    // Veren boşsa PersonId ve PersonName null döner (hane)
    Task<List<(int? PersonId, string? PersonName, DonationKind Kind, decimal Total)>> GetYearTotalsByGiverAndKindAsync(int year);
}
