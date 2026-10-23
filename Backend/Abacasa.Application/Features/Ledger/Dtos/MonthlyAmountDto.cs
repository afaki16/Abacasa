namespace Abacasa.Application.Features.Ledger.Dtos;

// Hücre; Amount null ise "girilmemiş"
public class MonthlyAmountDto
{
    public int LedgerItemId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal? Amount { get; set; }
}

public class SetMonthlyAmountDto
{
    /// null: hücreyi temizle (girilmemiş)
    public decimal? Amount { get; set; }
}

// Yeni kayıt açıldıysa Created true (201); güncelleme ve temizleme 200
public class SetMonthlyAmountResultDto
{
    public MonthlyAmountDto Cell { get; set; }
    public bool Created { get; set; }
}
