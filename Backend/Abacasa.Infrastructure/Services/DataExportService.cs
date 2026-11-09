using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Entities;
using Abacasa.Infrastructure.Persistence;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Text;

namespace Abacasa.Infrastructure.Services;

// Excel dışa aktarım (ClosedXML). Ortak biçim: kalın ve sabitlenmiş başlık satırı, içeriğe göre sütun genişliği,
// tarihler tarih (gg.aa.yyyy), tutarlar sayı (#,##0.00), ilişkiler ad olarak, yalnızca canlı kayıtlar.
// Yeni bir hane tablosu eklenince hane dışa aktarımına sayfası eklenir (CLAUDE.md).
public class DataExportService : IDataExportService
{
    private const string DateFormat = "dd.mm.yyyy";
    private const string DateTimeFormat = "dd.mm.yyyy hh:mm";
    private const string MoneyFormat = "#,##0.00";
    private const string RateFormat = "#,##0.0000";

    private readonly ApplicationDbContext _context;

    public DataExportService(ApplicationDbContext context)
    {
        _context = context;
    }

    private sealed record Column<T>(string Header, Func<T, object?> Value, string? Format = null);
    private sealed record SessionRow(DateTime CreatedDate, DateTime ExpiryDate, DateTime? RevokedDate, string? IpAddress, string? DeviceName, string? UserAgent);
    private sealed record AttemptRow(DateTime AttemptedAt, string IpAddress, bool Success);

    public async Task<ExportFile> ExportHouseholdAsync(int tenantId, CancellationToken cancellationToken = default)
    {
        // Hane verisi sorguları global tenant filtresinden geçer; Kurlar sayfası yalnızca hanenin elle girdiği kurlar (TCMB kurları global) (oturumun aktif hanesi); soft-deleted satırlar girmez
        var tenant = await _context.Tenants.AsNoTracking().FirstAsync(t => t.Id == tenantId, cancellationToken);

        var expenses = await _context.Expenses.AsNoTracking()
            .Include(e => e.Category).Include(e => e.PaymentMethod).Include(e => e.OwnerPerson).Include(e => e.RecurringPayment)
            .OrderBy(e => e.Date).ThenBy(e => e.Id).ToListAsync(cancellationToken);
        var funds = await _context.DonationFunds.AsNoTracking().Include(f => f.FromPerson)
            .OrderBy(f => f.Date).ThenBy(f => f.Id).ToListAsync(cancellationToken);
        var donations = await _context.Donations.AsNoTracking()
            .Include(d => d.GiverPerson).Include(d => d.PaymentMethod).Include(d => d.RecurringPayment)
            .OrderBy(d => d.Date).ThenBy(d => d.Id).ToListAsync(cancellationToken);
        var plans = await _context.RecurringPayments.AsNoTracking()
            .Include(p => p.PaymentMethod).Include(p => p.Category).Include(p => p.OwnerPerson)
            .OrderBy(p => p.Name).ThenBy(p => p.Id).ToListAsync(cancellationToken);
        var debts = await _context.Debts.AsNoTracking().Include(d => d.CreditorPerson).Include(d => d.DebtorPerson)
            .OrderBy(d => d.Date).ThenBy(d => d.Id).ToListAsync(cancellationToken);
        var debtPayments = await _context.DebtPayments.AsNoTracking().Include(p => p.Debt).ThenInclude(d => d.CreditorPerson)
            .OrderBy(p => p.Date).ThenBy(p => p.Id).ToListAsync(cancellationToken);
        var rates = await _context.ExchangeRates.AsNoTracking().OrderBy(r => r.Date).ThenBy(r => r.Id).ToListAsync(cancellationToken);
        var targets = await _context.DonationTargets.AsNoTracking().Include(t => t.OwnerPerson)
            .OrderBy(t => t.Year).ThenBy(t => t.Id).ToListAsync(cancellationToken);
        var movements = await _context.FundMovements.AsNoTracking().Include(m => m.Fund).ThenInclude(f => f.FromPerson)
            .OrderBy(m => m.Date).ThenBy(m => m.Id).ToListAsync(cancellationToken);
        var ledgerItems = await _context.LedgerItems.AsNoTracking().Include(i => i.OwnerPerson)
            .OrderBy(i => i.Direction).ThenBy(i => i.Name).ToListAsync(cancellationToken);
        var monthlyAmounts = await _context.MonthlyAmounts.AsNoTracking().Include(m => m.LedgerItem)
            .OrderBy(m => m.Year).ThenBy(m => m.Month).ThenBy(m => m.LedgerItemId).ToListAsync(cancellationToken);
        var vehicles = await _context.Vehicles.AsNoTracking().Include(v => v.OwnerPerson)
            .OrderBy(v => v.Name).ThenBy(v => v.Id).ToListAsync(cancellationToken);
        var obligations = await _context.VehicleObligations.AsNoTracking().Include(o => o.Vehicle)
            .OrderBy(o => o.Date).ThenBy(o => o.Id).ToListAsync(cancellationToken);
        var categories = await _context.Categories.AsNoTracking().OrderBy(c => c.Name).ToListAsync(cancellationToken);
        var people = await _context.People.AsNoTracking().OrderBy(p => p.Name).ToListAsync(cancellationToken);
        var paymentMethods = await _context.PaymentMethods.AsNoTracking().Include(p => p.OwnerPerson)
            .OrderBy(p => p.Name).ToListAsync(cancellationToken);
        // Üyelik ITenantScoped değil: hane ile sorgulanır
        var members = await _context.TenantMemberships.AsNoTracking().Include(m => m.User)
            .Where(m => m.TenantId == tenantId)
            .OrderBy(m => m.CreatedDate).ThenBy(m => m.Id).ToListAsync(cancellationToken);

        using var workbook = new XLWorkbook();

        AddSheet(workbook, "Harcamalar", expenses,
            new Column<Expense>("Tarih", e => e.Date, DateFormat),
            new Column<Expense>("Tutar", e => e.Amount, MoneyFormat),
            new Column<Expense>("Kategori", e => e.Category?.Name),
            new Column<Expense>("Ödeme aracı", e => e.PaymentMethod?.Name),
            new Column<Expense>("Kişi", e => e.OwnerPerson?.Name),
            new Column<Expense>("Açıklama", e => e.Description),
            new Column<Expense>("Sabit ödeme", e => e.RecurringPayment?.Name),
            new Column<Expense>("Sabit ödeme ayı", e => e.RecurringPaymentMonth, DateFormat));

        AddSheet(workbook, "Bağışlar", donations,
            new Column<Donation>("Tarih", d => d.Date, DateFormat),
            new Column<Donation>("Tutar", d => d.Amount, MoneyFormat),
            new Column<Donation>("Tür", d => DonationKindLabel(d.Kind)),
            new Column<Donation>("Alıcı", d => d.Recipient),
            new Column<Donation>("Veren", d => d.GiverPerson?.Name),
            new Column<Donation>("Ödeme aracı", d => d.PaymentMethod?.Name),
            new Column<Donation>("Emanet", d => FundLabel(funds.FirstOrDefault(f => f.Id == d.FundId))),
            new Column<Donation>("Sabit ödeme", d => d.RecurringPayment?.Name),
            new Column<Donation>("Not", d => d.Note));

        AddSheet(workbook, "Sabit ödemeler", plans,
            new Column<RecurringPayment>("Ad", p => p.Name),
            new Column<RecurringPayment>("Tür", p => RecurringKindLabel(p.Kind)),
            new Column<RecurringPayment>("Beklenen tutar", p => p.ExpectedAmount, MoneyFormat),
            new Column<RecurringPayment>("Vade günü", p => p.DueDay),
            new Column<RecurringPayment>("Başlangıç ayı", p => p.StartMonth, DateFormat),
            new Column<RecurringPayment>("Aktif", p => p.IsActive),
            new Column<RecurringPayment>("Ödeme aracı", p => p.PaymentMethod?.Name),
            new Column<RecurringPayment>("Kategori", p => p.Category?.Name),
            new Column<RecurringPayment>("Kişi", p => p.OwnerPerson?.Name),
            new Column<RecurringPayment>("Alıcı", p => p.Recipient),
            new Column<RecurringPayment>("Bağış türü", p => p.DonationKind is DonationKind k ? DonationKindLabel(k) : null),
            new Column<RecurringPayment>("Toplam tutar", p => p.TotalAmount, MoneyFormat),
            new Column<RecurringPayment>("Taksit sayısı", p => p.InstallmentCount),
            new Column<RecurringPayment>("İlk vade", p => p.FirstDueDate, DateFormat));

        AddSheet(workbook, "Borçlar", debts,
            new Column<Debt>("Tarih", d => d.Date, DateFormat),
            new Column<Debt>("Alacaklı", d => d.CreditorPerson?.Name),
            new Column<Debt>("Borçlu", d => d.DebtorPerson?.Name),
            new Column<Debt>("Para birimi", d => CurrencyLabel(d.Currency)),
            new Column<Debt>("Tutar", d => d.Amount, MoneyFormat),
            new Column<Debt>("Not", d => d.Note));

        AddSheet(workbook, "Borç ödemeleri", debtPayments,
            new Column<DebtPayment>("Tarih", p => p.Date, DateFormat),
            new Column<DebtPayment>("Borç", p => p.Debt == null ? null : $"{p.Debt.CreditorPerson?.Name} · {p.Debt.Date:dd.MM.yyyy}"),
            new Column<DebtPayment>("Para birimi", p => p.Debt == null ? null : CurrencyLabel(p.Debt.Currency)),
            new Column<DebtPayment>("Tutar", p => p.Amount, MoneyFormat),
            new Column<DebtPayment>("Kur", p => p.ExchangeRate, RateFormat),
            new Column<DebtPayment>("Not", p => p.Note));

        AddSheet(workbook, "Kurlar", rates,
            new Column<ExchangeRate>("Tarih", r => r.Date, DateFormat),
            new Column<ExchangeRate>("Para birimi", r => CurrencyLabel(r.Currency)),
            new Column<ExchangeRate>("Kur", r => r.Rate, RateFormat));

        AddSheet(workbook, "Bağış hedefleri", targets,
            new Column<DonationTarget>("Yıl", t => t.Year),
            new Column<DonationTarget>("Kişi", t => t.OwnerPerson?.Name),
            new Column<DonationTarget>("Tür", t => DonationKindLabel(t.Kind)),
            new Column<DonationTarget>("Tutar", t => t.Amount, MoneyFormat),
            new Column<DonationTarget>("Not", t => t.Note));

        AddSheet(workbook, "Emanetler", funds,
            new Column<DonationFund>("Tarih", f => f.Date, DateFormat),
            new Column<DonationFund>("Veren", f => f.FromPerson?.Name),
            new Column<DonationFund>("Tür", f => DonationKindLabel(f.Kind)),
            new Column<DonationFund>("Tutar", f => f.Amount, MoneyFormat),
            new Column<DonationFund>("Not", f => f.Note));

        AddSheet(workbook, "Emanet hareketleri", movements,
            new Column<FundMovement>("Tarih", m => m.Date, DateFormat),
            new Column<FundMovement>("Emanet", m => FundLabel(m.Fund)),
            new Column<FundMovement>("Tür", m => m.Type == FundMovementType.Use ? "Kullanım" : "Yerine koyma"),
            new Column<FundMovement>("Tutar", m => m.Amount, MoneyFormat),
            new Column<FundMovement>("Not", m => m.Note));

        AddSheet(workbook, "Yıllık tablo kalemleri", ledgerItems,
            new Column<LedgerItem>("Ad", i => i.Name),
            new Column<LedgerItem>("Yön", i => i.Direction == LedgerDirection.Income ? "Gelir" : "Gider"),
            new Column<LedgerItem>("Kişi", i => i.OwnerPerson?.Name),
            new Column<LedgerItem>("Aktif", i => i.IsActive));

        AddSheet(workbook, "Yıllık tablo tutarları", monthlyAmounts,
            new Column<MonthlyAmount>("Kalem", m => m.LedgerItem?.Name),
            new Column<MonthlyAmount>("Yıl", m => m.Year),
            new Column<MonthlyAmount>("Ay", m => m.Month),
            new Column<MonthlyAmount>("Tutar", m => m.Amount, MoneyFormat));

        AddSheet(workbook, "Araçlar", vehicles,
            new Column<Vehicle>("Ad", v => v.Name),
            new Column<Vehicle>("Plaka", v => v.Plate),
            new Column<Vehicle>("Sahibi", v => v.OwnerPerson?.Name),
            new Column<Vehicle>("Aktif", v => v.IsActive),
            new Column<Vehicle>("Not", v => v.Note));

        AddSheet(workbook, "Araç işlemleri", obligations,
            new Column<VehicleObligation>("Araç", o => o.Vehicle?.Name),
            new Column<VehicleObligation>("Tür", o => ObligationTypeLabel(o.Type)),
            new Column<VehicleObligation>("Tarih", o => o.Date, DateFormat),
            new Column<VehicleObligation>("Geçerlilik sonu", o => o.ValidUntil, DateFormat),
            new Column<VehicleObligation>("Tutar", o => o.Amount, MoneyFormat),
            new Column<VehicleObligation>("Harcamaya bağlı", o => o.ExpenseId != null),
            new Column<VehicleObligation>("Not", o => o.Note));

        AddSheet(workbook, "Kategoriler", categories,
            new Column<Category>("Ad", c => c.Name));

        AddSheet(workbook, "Kişiler", people,
            new Column<Person>("Ad", p => p.Name),
            new Column<Person>("Yakınlık", p => p.Relation));

        AddSheet(workbook, "Ödeme araçları", paymentMethods,
            new Column<PaymentMethod>("Ad", p => p.Name),
            new Column<PaymentMethod>("Tür", p => PaymentMethodTypeLabel(p.Type)),
            new Column<PaymentMethod>("Banka", p => p.Bank),
            new Column<PaymentMethod>("Sahibi", p => p.OwnerPerson?.Name),
            new Column<PaymentMethod>("Hesap kesim günü", p => p.StatementDay),
            new Column<PaymentMethod>("Aktif", p => p.IsActive));

        AddSheet(workbook, "Üyeler", members,
            new Column<TenantMembership>("Ad", m => m.User?.FullName),
            new Column<TenantMembership>("E-posta", m => m.User?.Email),
            new Column<TenantMembership>("Rol", m => HouseholdRoleLabel(m.Role)),
            new Column<TenantMembership>("Katılma tarihi", m => m.CreatedDate, DateFormat));

        return new ExportFile($"abacasa-{Slug(tenant.Name)}-{DateTime.UtcNow:yyyyMMdd}.xlsx", Save(workbook));
    }

    public async Task<ExportFile> ExportAccountAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.AsNoTracking().FirstAsync(u => u.Id == userId, cancellationToken);

        // Üyelikler bütün hanelerde: kişi adı için tenant filtresi kapatılır, yalnızca bu kullanıcının bağlı kişileri okunur
        var memberships = await _context.TenantMemberships.AsNoTracking().Include(m => m.Tenant)
            .Where(m => m.UserId == userId && _context.Tenants.Any(t => t.Id == m.TenantId))
            .OrderBy(m => m.CreatedDate).ThenBy(m => m.Id).ToListAsync(cancellationToken);
        var personIds = memberships.Where(m => m.PersonId != null).Select(m => m.PersonId!.Value).ToList();
        var personNames = await _context.People.IgnoreQueryFilters().AsNoTracking()
            .Where(p => personIds.Contains(p.Id) && !p.IsDeleted)
            .ToDictionaryAsync(p => p.Id, p => p.Name, cancellationToken);

        var consents = await _context.ConsentRecords.AsNoTracking().Where(c => c.UserId == userId)
            .OrderBy(c => c.AcceptedAt).ThenBy(c => c.Id).ToListAsync(cancellationToken);
        // Token değeri asla yazılmaz: yalnızca tarih, IP ve cihaz alanları seçilir
        var sessions = await _context.RefreshTokens.AsNoTracking().Where(t => t.UserId == userId)
            .OrderBy(t => t.CreatedDate)
            .Select(t => new SessionRow(t.CreatedDate, t.ExpiryDate, t.RevokedDate, t.IpAddress, t.DeviceName, t.UserAgent))
            .ToListAsync(cancellationToken);
        var attempts = await _context.LoginAttempts.AsNoTracking().Where(a => a.Email == user.Email)
            .OrderBy(a => a.AttemptedAt)
            .Select(a => new AttemptRow(a.AttemptedAt, a.IpAddress, a.Success))
            .ToListAsync(cancellationToken);

        using var workbook = new XLWorkbook();

        AddSheet(workbook, "Hesap", new[] { user },
            new Column<User>("Ad", u => u.FirstName),
            new Column<User>("Soyad", u => u.LastName),
            new Column<User>("E-posta", u => u.Email),
            new Column<User>("Telefon", u => u.PhoneNumber),
            // Fotoğrafın kendisi Excel'e konmaz; Profilim sayfasından görülebilir/indirilebilir
            new Column<User>("Profil fotoğrafı", u => string.IsNullOrEmpty(u.ProfileImageKey) ? "Yok" : "Var"),
            new Column<User>("Durum", u => UserStatusLabel(u.Status)),
            new Column<User>("Kayıt tarihi", u => u.CreatedDate, DateFormat),
            new Column<User>("Son giriş", u => u.LastLoginDate, DateTimeFormat));

        AddSheet(workbook, "Üyelikler", memberships,
            new Column<TenantMembership>("Hane", m => m.Tenant?.Name),
            new Column<TenantMembership>("Rol", m => HouseholdRoleLabel(m.Role)),
            new Column<TenantMembership>("Katılma tarihi", m => m.CreatedDate, DateFormat),
            new Column<TenantMembership>("Bağlı kişi", m => m.PersonId is int id && personNames.TryGetValue(id, out var name) ? name : null));

        AddSheet(workbook, "Onaylar", consents,
            new Column<ConsentRecord>("Belge", c => c.DocumentType == LegalDocumentType.Terms ? "Kullanım koşulları" : "Aydınlatma metni"),
            new Column<ConsentRecord>("Sürüm", c => c.Version),
            new Column<ConsentRecord>("Tarih", c => c.AcceptedAt, DateTimeFormat));

        AddSheet(workbook, "Oturumlar", sessions,
            new Column<SessionRow>("Oluşma", s => s.CreatedDate, DateTimeFormat),
            new Column<SessionRow>("Bitiş", s => s.ExpiryDate, DateTimeFormat),
            new Column<SessionRow>("İptal", s => s.RevokedDate, DateTimeFormat),
            new Column<SessionRow>("IP", s => s.IpAddress),
            new Column<SessionRow>("Cihaz", s => s.DeviceName),
            new Column<SessionRow>("Tarayıcı", s => s.UserAgent));

        AddSheet(workbook, "Giriş denemeleri", attempts,
            new Column<AttemptRow>("Tarih", a => a.AttemptedAt, DateTimeFormat),
            new Column<AttemptRow>("IP", a => a.IpAddress),
            new Column<AttemptRow>("Başarılı", a => a.Success));

        return new ExportFile($"abacasa-hesabim-{DateTime.UtcNow:yyyyMMdd}.xlsx", Save(workbook));
    }

    // Boş tablonun sayfası da yalnızca başlıkla oluşur
    private static void AddSheet<T>(XLWorkbook workbook, string name, IEnumerable<T> rows, params Column<T>[] columns)
    {
        var sheet = workbook.Worksheets.Add(name);
        for (var c = 0; c < columns.Length; c++)
            sheet.Cell(1, c + 1).Value = columns[c].Header;

        var header = sheet.Range(1, 1, 1, columns.Length);
        header.Style.Font.Bold = true;
        sheet.SheetView.FreezeRows(1);

        var r = 2;
        foreach (var row in rows)
        {
            for (var c = 0; c < columns.Length; c++)
            {
                var cell = sheet.Cell(r, c + 1);
                SetValue(cell, columns[c].Value(row));
                if (columns[c].Format != null)
                    cell.Style.NumberFormat.Format = columns[c].Format;
            }
            r++;
        }

        sheet.Columns(1, columns.Length).AdjustToContents();
    }

    private static void SetValue(IXLCell cell, object? value)
    {
        switch (value)
        {
            case null: cell.Value = Blank.Value; break;
            case DateOnly d: cell.Value = d.ToDateTime(TimeOnly.MinValue); break;
            case DateTime dt: cell.Value = dt; break;
            case decimal m: cell.Value = m; break;
            case int i: cell.Value = i; break;
            case bool b: cell.Value = b ? "Evet" : "Hayır"; break;
            default: cell.Value = Convert.ToString(value, CultureInfo.InvariantCulture); break;
        }
    }

    private static byte[] Save(XLWorkbook workbook)
    {
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    // Dosya adı için hane adı: küçük harf, Türkçe harfler sadeleşir, harf/rakam dışı tire
    private static string Slug(string name)
    {
        var map = new Dictionary<char, char> { ['ç'] = 'c', ['ğ'] = 'g', ['ı'] = 'i', ['ö'] = 'o', ['ş'] = 's', ['ü'] = 'u', ['â'] = 'a', ['î'] = 'i', ['û'] = 'u' };
        var sb = new StringBuilder();
        foreach (var ch in name.ToLower(new CultureInfo("tr-TR")))
        {
            var c = map.TryGetValue(ch, out var mapped) ? mapped : ch;
            sb.Append(c is >= 'a' and <= 'z' or >= '0' and <= '9' ? c : '-');
        }
        var slug = string.Join('-', sb.ToString().Split('-', StringSplitOptions.RemoveEmptyEntries));
        return slug.Length == 0 ? "hane" : slug;
    }

    private static string? FundLabel(DonationFund? fund) =>
        fund == null ? null : $"{fund.FromPerson?.Name} · {fund.Date:dd.MM.yyyy}";

    private static string CurrencyLabel(Currency currency) => currency switch
    {
        Currency.TRY => "TL",
        Currency.USD => "Dolar",
        Currency.EUR => "Euro",
        Currency.QuarterGold => "Çeyrek altın",
        _ => currency.ToString()
    };

    private static string DonationKindLabel(DonationKind kind) => kind switch
    {
        DonationKind.Donation => "Bağış",
        DonationKind.Zakat => "Zekat",
        DonationKind.Scholarship => "Burs",
        _ => kind.ToString()
    };

    private static string RecurringKindLabel(RecurringPaymentKind kind) => kind switch
    {
        RecurringPaymentKind.Subscription => "Abonelik",
        RecurringPaymentKind.Bill => "Fatura",
        RecurringPaymentKind.Installment => "Taksit",
        RecurringPaymentKind.Donation => "Bağış",
        _ => kind.ToString()
    };

    private static string PaymentMethodTypeLabel(PaymentMethodType type) => type switch
    {
        PaymentMethodType.Cash => "Nakit",
        PaymentMethodType.BankAccount => "Banka hesabı",
        PaymentMethodType.CreditCard => "Kredi kartı",
        PaymentMethodType.MealCard => "Yemek kartı",
        _ => type.ToString()
    };

    private static string ObligationTypeLabel(VehicleObligationType type) => type switch
    {
        VehicleObligationType.TrafficInsurance => "Trafik sigortası",
        VehicleObligationType.Kasko => "Kasko",
        VehicleObligationType.Inspection => "Muayene",
        VehicleObligationType.Mtv => "MTV",
        VehicleObligationType.Maintenance => "Bakım",
        _ => type.ToString()
    };

    private static string HouseholdRoleLabel(HouseholdRole role) => role == HouseholdRole.Admin ? "Yönetici" : "Üye";

    private static string UserStatusLabel(UserStatus status) => status switch
    {
        UserStatus.Active => "Aktif",
        UserStatus.Inactive => "Pasif",
        UserStatus.Banned => "Yasaklı",
        UserStatus.PendingVerification => "Doğrulama bekliyor",
        _ => status.ToString()
    };
}
