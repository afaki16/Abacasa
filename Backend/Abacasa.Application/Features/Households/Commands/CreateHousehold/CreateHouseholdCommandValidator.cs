using FluentValidation;
using Abacasa.Application.Common.Localization;

namespace Abacasa.Application.Features.Households.Commands.CreateHousehold;

public class CreateHouseholdCommandValidator : AbstractValidator<CreateHouseholdCommand>
{
    public CreateHouseholdCommandValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Name)
            .Must(n => !string.IsNullOrWhiteSpace(n)).WithMessage(localizer["validation.required", localizer["validation.fields.householdName"]])
            .MaximumLength(100).WithMessage(localizer["validation.maxLength", localizer["validation.fields.householdName"], 100]);
    }
}
