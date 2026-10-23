using FluentValidation;
using Abacasa.Application.Common.Localization;

namespace Abacasa.Application.Features.Households.Commands.UpdateHousehold;

public class UpdateHouseholdCommandValidator : AbstractValidator<UpdateHouseholdCommand>
{
    public UpdateHouseholdCommandValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Name)
            .Must(n => !string.IsNullOrWhiteSpace(n)).WithMessage(localizer["validation.required", localizer["validation.fields.householdName"]])
            .MaximumLength(100).WithMessage(localizer["validation.maxLength", localizer["validation.fields.householdName"], 100]);
    }
}
