using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Interfaces;
using MediatR;

namespace Abacasa.Application.Features.Auth.Queries.CheckRegisterAvailability
{
    /// <summary>
    /// Live check on the public register form. Reveals no more than the register endpoint itself
    /// (which answers "email exists" on submit) and has its own bucket at the register rate, so it adds
    /// no extra enumeration capacity. Same uniqueness scope as register: identity is global (all users).
    /// </summary>
    public class CheckRegisterAvailabilityQuery : IRequest<Result<CheckAvailabilityDto>>
    {
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
    }

    public class FieldAvailability
    {
        public bool IsAvailable { get; set; }
        public string? Reason { get; set; }
    }

    /// <summary>A field is null when it was not asked about.</summary>
    public class CheckAvailabilityDto
    {
        public FieldAvailability? Email { get; set; }
        public FieldAvailability? PhoneNumber { get; set; }
    }

    public class CheckRegisterAvailabilityQueryHandler : IRequestHandler<CheckRegisterAvailabilityQuery, Result<CheckAvailabilityDto>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJsonStringLocalizer _localizer;
        private readonly IPhoneNumberService _phoneNumberService;

        public CheckRegisterAvailabilityQueryHandler(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer, IPhoneNumberService phoneNumberService)
        {
            _unitOfWork = unitOfWork;
            _localizer = localizer;
            _phoneNumberService = phoneNumberService;
        }

        public async Task<Result<CheckAvailabilityDto>> Handle(CheckRegisterAvailabilityQuery request, CancellationToken cancellationToken)
        {
            var dto = new CheckAvailabilityDto();

            if (!string.IsNullOrWhiteSpace(request.Email))
            {
                // Kimlik global: kayıt ucuyla aynı kontrol (tüm kullanıcılar)
                var taken = await _unitOfWork.Users.EmailExistsAsync(request.Email.Trim().ToLowerInvariant());
                dto.Email = new FieldAvailability { IsAvailable = !taken, Reason = taken ? _localizer["users.emailExists"] : null };
            }

            if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
            {
                // Kayıt ucuyla aynı normalizasyon; geçersiz numara bu şekilde bildirilir
                var phone = _phoneNumberService.Normalize(request.PhoneNumber);
                if (!phone.IsSuccess)
                {
                    dto.PhoneNumber = new FieldAvailability { IsAvailable = false, Reason = _localizer["validation.phoneInvalid"] };
                }
                else
                {
                    var taken = await _unitOfWork.Users.PhoneExistsAsync(phone.Value!);
                    dto.PhoneNumber = new FieldAvailability { IsAvailable = !taken, Reason = taken ? _localizer["users.phoneExists"] : null };
                }
            }

            return Result<CheckAvailabilityDto>.Success(dto);
        }
    }
}
