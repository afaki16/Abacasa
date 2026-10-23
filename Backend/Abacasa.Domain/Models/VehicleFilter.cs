namespace Abacasa.Domain.Models;

/// Araç listesi için filtre. SearchTerm ad ve plaka içinde arar.
public class VehicleFilter
{
    public bool? IsActive { get; set; }
    public string? SearchTerm { get; set; }
}
