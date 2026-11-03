using FluentValidation;

namespace Abacasa.Application.Common.Validation
{
    /// <summary>
    /// Turkish national ID (T.C. Kimlik No): 11 digits, first digit not 0, two checksum digits.
    /// No field uses it yet; ready for features that collect it.
    /// Frontend counterpart: useValidators().validationRules.tcKimlik / optionalTcKimlik.
    /// </summary>
    public static class TcKimlikValidator
    {
        public static bool IsValid(string? value)
        {
            if (value is null || value.Length != 11 || value[0] == '0' || !value.All(char.IsAsciiDigit))
                return false;

            var d = value.Select(c => c - '0').ToArray();
            var oddSum = d[0] + d[2] + d[4] + d[6] + d[8];
            var evenSum = d[1] + d[3] + d[5] + d[7];

            // ((oddSum * 7 - evenSum) mod 10) can be negative in C#; normalise before comparing
            if (((oddSum * 7 - evenSum) % 10 + 10) % 10 != d[9])
                return false;

            return d.Take(10).Sum() % 10 == d[10];
        }

        /// <summary>RuleFor(x => x.TcKimlik).MustBeValidTcKimlik(message) — empty values are left to NotEmpty().</summary>
        public static IRuleBuilderOptions<T, string?> MustBeValidTcKimlik<T>(this IRuleBuilder<T, string?> ruleBuilder, string message)
        {
            return ruleBuilder
                .Must(value => string.IsNullOrEmpty(value) || IsValid(value))
                .WithMessage(message);
        }
    }
}
