using FluentValidation;
using Abacasa.Application.Common.Localization;

namespace Abacasa.Application.Features.Households.Commands.CreateHouseholdInvitation;

public class CreateHouseholdInvitationCommandValidator : AbstractValidator<CreateHouseholdInvitationCommand>
{
    public CreateHouseholdInvitationCommandValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage(localizer["validation.required", localizer["validation.fields.email"]])
            .EmailAddress().WithMessage(localizer["validation.emailFormat"])
            .MaximumLength(256).WithMessage(localizer["validation.maxLength", localizer["validation.fields.email"], 256]);

        RuleFor(x => x.Role)
            .IsInEnum().WithMessage(localizer["validation.invalidEnum", localizer["validation.fields.role"]]);
    }
}
