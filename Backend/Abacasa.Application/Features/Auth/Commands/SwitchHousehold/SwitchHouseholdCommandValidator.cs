using FluentValidation;
using Abacasa.Application.Common.Localization;

namespace Abacasa.Application.Features.Auth.Commands.SwitchHousehold
{
    public class SwitchHouseholdCommandValidator : AbstractValidator<SwitchHouseholdCommand>
    {
        public SwitchHouseholdCommandValidator(IJsonStringLocalizer localizer)
        {
            RuleFor(x => x.TenantId)
                .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.tenantId"]]);
        }
    }
}
