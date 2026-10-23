namespace Abacasa.Application.Common;

// Telefon tüm sistemde benzersiz; karşılaştırma ve kayıt normalize edilmiş biçimle yapılır.
// Boşluk, tire, nokta ve parantez atılır; boş değer null olur.
public static class PhoneNumberNormalizer
{
    public static string? Normalize(string? phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            return null;

        var normalized = new string(phoneNumber
            .Where(c => !char.IsWhiteSpace(c) && c != '-' && c != '.' && c != '(' && c != ')')
            .ToArray());

        return normalized.Length == 0 ? null : normalized;
    }
}
