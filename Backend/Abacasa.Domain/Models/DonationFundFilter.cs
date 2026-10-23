namespace Abacasa.Domain.Models;

/// Emanet listesi için filtre. IsClosed kalan tutara göre (bağlı bağışlardan) hesaplanır.
public class DonationFundFilter
{
    public bool? IsClosed { get; set; }
    public string? SearchTerm { get; set; }
}
