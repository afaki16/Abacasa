namespace Abacasa.Domain.Models;

/// Bir emanetin bağlı canlı bağış ve hareket toplamları (SQL'de gruplanır).
public class FundTotals
{
    public int FundId { get; set; }
    public decimal Distributed { get; set; }
    public int DistributionCount { get; set; }
    public decimal Uses { get; set; }
    public decimal Returns { get; set; }
    public int MovementCount { get; set; }
}
