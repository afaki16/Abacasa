using FluentValidation;
using Abacasa.Application.Common.Localization;

namespace Abacasa.Application.Features.Households.Commands.UpdateHouseholdMember;

public class UpdateHouseholdMemberCommandValidator : AbstractValidator<UpdateHouseholdMemberCommand>
{
    public UpdateHouseholdMemberCommandValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Role)
            .IsInEnum().WithMessage(localizer["validation.invalidEnum", localizer["validation.fields.role"]]);
    }
}
