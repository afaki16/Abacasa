using FluentValidation;
using Abacasa.Application.Common.Localization;

namespace Abacasa.Application.Features.People.Commands.UpdatePerson;

public class UpdatePersonCommandValidator : AbstractValidator<UpdatePersonCommand>
{
    public UpdatePersonCommandValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.personId"]]);

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(localizer["validation.required", localizer["validation.fields.personName"]])
            .MaximumLength(100).WithMessage(localizer["validation.maxLength", localizer["validation.fields.personName"], 100]);

        RuleFor(x => x.Relation)
            .MaximumLength(50).WithMessage(localizer["validation.maxLength", localizer["validation.fields.relation"], 50])
            .When(x => !string.IsNullOrEmpty(x.Relation));
    }
}
