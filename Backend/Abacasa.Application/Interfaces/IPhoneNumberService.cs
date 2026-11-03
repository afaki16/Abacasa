using Abacasa.Application.Common.Results;

namespace Abacasa.Application.Interfaces
{
    /// <summary>
    /// Single canonical form for phone numbers (E.164, e.g. +905551112233) so "0555 111 22 33",
    /// "5551112233" and "+90 555 111 22 33" are one number for uniqueness checks, lookups and SMS.
    /// Numbers without a country code use App:DefaultPhoneRegion (default "TR").
    /// </summary>
    public interface IPhoneNumberService
    {
        /// <summary>
        /// Returns the E.164 form, null for empty input, or a validation failure for an invalid number.
        /// Use on every write path and before every phone lookup.
        /// </summary>
        Result<string?> Normalize(string? phoneNumber);
    }
}
