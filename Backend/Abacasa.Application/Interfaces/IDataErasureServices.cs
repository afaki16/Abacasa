namespace Abacasa.Application.Interfaces;

// Hane silme: hanenin bütün satırları (canlı ve silinmiş), davetler, üyelikler, haneye özel roller ve Tenant satırı.
// Transaction çağırana aittir. Etkilenen (üyeliği olan) kullanıcıları döner; izin önbellekleri çağıranca temizlenir.
public interface IHouseholdEraser
{
    Task<IReadOnlyCollection<int>> EraseAsync(int tenantId, CancellationToken cancellationToken = default);
}

// Hesap anonimleştirme (hesap silme ve imha işi ortak): üyelikler, e-postasına bekleyen davetler, token'lar, roller ve
// giriş denemeleri silinir; kişisel alanlar anonimleşir, kullanıcı soft delete olur. Transaction çağırana aittir.
public interface IUserAnonymizer
{
    Task AnonymizeAsync(int userId, CancellationToken cancellationToken = default);
}

// İmha işi: süresi geçmiş soft-deleted hane verisi, kullanıcılar, haneler ve yardımcı tablolar.
// Tablo başına silinen ya da anonimleştirilen satır sayısını döner.
public interface IDataRetentionRunner
{
    Task<IReadOnlyDictionary<string, int>> RunAsync(CancellationToken cancellationToken = default);
}
