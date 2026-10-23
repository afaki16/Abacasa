namespace Abacasa.Application.Interfaces;

public sealed record ExportFile(string FileName, byte[] Content)
{
    public const string XlsxContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
}

// Excel (xlsx) dışa aktarım: yalnızca canlı kayıtlar, ilişkiler ad olarak, başlıklar Türkçe
public interface IDataExportService
{
    // Aktif hanenin verisi; sorgular tenant filtresinden geçer (başka hanenin verisi giremez)
    Task<ExportFile> ExportHouseholdAsync(int tenantId, CancellationToken cancellationToken = default);

    // Kullanıcının kişisel verisi (hesap, üyelikler, onaylar, oturumlar, giriş denemeleri); token değeri yazılmaz
    Task<ExportFile> ExportAccountAsync(int userId, CancellationToken cancellationToken = default);
}
