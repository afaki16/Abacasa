using FluentValidation;
using Abacasa.Application.Common.Localization;

namespace Abacasa.Application.Features.People.Commands.CreatePerson;

public class CreatePersonCommandValidator : AbstractValidator<CreatePersonCommand>
{
    public CreatePersonCommandValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(localizer["validation.required", localizer["validation.fields.personName"]])
            .MaximumLength(100).WithMessage(localizer["validation.maxLength", localizer["validation.fields.personName"], 100]);

        RuleFor(x => x.Relation)
            .MaximumLength(50).WithMessage(localizer["validation.maxLength", localizer["validation.fields.relation"], 50])
            .When(x => !string.IsNullOrEmpty(x.Relation));
    }
}
