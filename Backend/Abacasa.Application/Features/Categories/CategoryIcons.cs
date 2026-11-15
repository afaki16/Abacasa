using System.Collections.Generic;

namespace Abacasa.Application.Features.Categories;

// Kategoriye seçilebilen ikon anahtarları (Material Icons adları, kebab-case). Web ve mobil aynı listeyi kendi
// ikon setine eşler; liste değişirse Frontend/utils/categoryIcons.ts ve Mobile/src/features/expenses/icons.ts de güncellenir.
public static class CategoryIcons
{
    public const int MaxLength = 50;

    public static readonly IReadOnlySet<string> Allowed = new HashSet<string>
    {
        "category", "shopping-cart", "shopping-bag", "restaurant", "local-cafe", "home", "receipt", "bolt",
        "water-drop", "wifi", "smartphone", "local-gas-station", "directions-car", "directions-bus", "flight",
        "school", "medical-services", "checkroom", "child-care", "pets", "fitness-center", "celebration", "movie",
        "card-giftcard", "volunteer-activism", "build", "savings", "spa",
    };

    // Boş değer "ikon yok" demektir (istemci addan tahmin eder)
    public static bool IsValid(string? icon) => string.IsNullOrWhiteSpace(icon) || Allowed.Contains(icon.Trim());

    public static string? Normalize(string? icon) => string.IsNullOrWhiteSpace(icon) ? null : icon.Trim();
}
