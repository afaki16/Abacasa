using System;
using System.Collections.Generic;

namespace Abacasa.Application.Features.Budgets.Dtos;

public class CreateBudgetDto
{
    /// Boşsa hane
    public int? OwnerPersonId { get; set; }
    public int StartYear { get; set; }
    public int StartMonth { get; set; }
    /// 0: bu aydan itibaren bütçe yok
    public decimal Amount { get; set; }
    public string? Note { get; set; }
}

public class UpdateBudgetDto
{
    public int? OwnerPersonId { get; set; }
    public int StartYear { get; set; }
    public int StartMonth { get; set; }
    public decimal Amount { get; set; }
    public string? Note { get; set; }
}

public class BudgetDto
{
    public int Id { get; set; }
    public int? OwnerPersonId { get; set; }
    public string? OwnerName { get; set; }       // Boşsa hane
    public int StartYear { get; set; }
    public int StartMonth { get; set; }
    public decimal Amount { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedDate { get; set; }
}

// Ayın bütçe raporu. Kullanılan = ayın harcamaları (yemek kartı hariç) + ayda vadesi olan ödenmemiş sabit ödemeler
// (yemek kartı ve bağış planları hariç). Bağışlar ve borç hareketleri bütçeye girmez. Ay sonunda kalan devretmez.
public class BudgetReportDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int DaysInMonth { get; set; }
    /// Bugün dahil kalan gün; geçmiş ayda 0, gelecek ayda ayın tamamı
    public int DaysLeft { get; set; }
    /// Ayda geçerli hane bütçesi yoksa boş
    public BudgetRowDto? Household { get; set; }
    /// Kişi bütçeleri (ada göre), sonra hane bütçesi varsa Ortak satırı
    public List<BudgetRowDto> Rows { get; set; } = new();
    /// Kişi bütçelerinin toplamı hane bütçesini aşıyor; Ortak bütçe 0 sayılır
    public bool PersonBudgetsExceedHousehold { get; set; }
    /// Tutarı belli olmayan bekleyen vadeler kullanılana girmez
    public int PendingUnknownCount { get; set; }
    public BudgetSuggestionDto Suggestion { get; set; } = new();
}

public class BudgetRowDto
{
    /// Geçerli bütçe kaydı; Ortak satırında boş
    public int? BudgetId { get; set; }
    /// Boşsa hane ya da Ortak
    public int? PersonId { get; set; }
    public string? Name { get; set; }
    /// Hane bütçesinden kişi bütçeleri çıkınca kalan; kişisiz kayıtlar ve bütçesi olmayan kişilerin harcamaları buraya düşer
    public bool IsShared { get; set; }
    public decimal Budget { get; set; }
    /// Gerçekleşen harcama
    public decimal Spent { get; set; }
    /// Ödenmemiş sabit ödeme vadeleri (bütçeden ayrılır)
    public decimal Pending { get; set; }
    /// Spent + Pending
    public decimal Used { get; set; }
    /// Budget − Used; eksi olabilir (aşıldı)
    public decimal Remaining { get; set; }
    /// Remaining / DaysLeft (eksi kalanda 0); kalan gün yoksa boş
    public decimal? DailyAllowance { get; set; }
    /// Used / Budget × 100 (bütçe 0 ise 0)
    public decimal UsedPercent { get; set; }
}

// Yıllık tablodaki gelirden öneri. Sabit ödemeler bütçeden ayrıldığı için önerilen bütçe gelirin kendisidir;
// değişken harcamaya kalan bilgi olarak gösterilir.
public class BudgetSuggestionDto
{
    /// Ayın girilmiş gelirleri; ay boşsa yılın girilmiş aylarının ortalaması; hiç yoksa boş
    public decimal? Income { get; set; }
    public bool IncomeIsAverage { get; set; }
    /// Ayda vadesi olan sabit ödemeler (ödenmiş + bekleyen; yemek kartı ve bağış planları hariç)
    public decimal FixedPayments { get; set; }
    /// Income − FixedPayments
    public decimal? VariableRoom { get; set; }
}
