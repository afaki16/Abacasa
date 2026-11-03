using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Models;
using Microsoft.Extensions.Configuration;
using PhoneNumbers;

namespace Abacasa.Infrastructure.Services
{
    public class PhoneNumberService : IPhoneNumberService
    {
        private static readonly PhoneNumberUtil Util = PhoneNumberUtil.GetInstance();

        private readonly string _defaultRegion;
        private readonly IJsonStringLocalizer _localizer;

        public PhoneNumberService(IConfiguration configuration, IJsonStringLocalizer localizer)
        {
            _defaultRegion = (configuration["App:DefaultPhoneRegion"] ?? "TR").ToUpperInvariant();
            _localizer = localizer;
        }

        public Result<string?> Normalize(string? phoneNumber)
        {
            if (string.IsNullOrWhiteSpace(phoneNumber))
                return Result<string?>.Success(null);

            try
            {
                // "00" international prefix is not understood by the parser in every region; treat it as "+"
                var input = phoneNumber.Trim();
                if (input.StartsWith("00"))
                    input = "+" + input[2..];

                var parsed = Util.Parse(input, _defaultRegion);
                if (Util.IsValidNumber(parsed))
                    return Result<string?>.Success(Util.Format(parsed, PhoneNumberFormat.E164));
            }
            catch (NumberParseException)
            {
                // Falls through to the validation error below
            }

            return Result<string?>.Failure(Error.Failure(ErrorCode.ValidationFailed, _localizer["validation.phoneInvalid"]));
        }
    }
}
