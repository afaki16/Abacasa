using FluentValidation;
using Abacasa.Application.Common.Localization;

namespace Abacasa.Application.Features.Ledger.Commands.CreateLedgerItem;

public class CreateLedgerItemCommandValidator : AbstractValidator<CreateLedgerItemCommand>
{
    public CreateLedgerItemCommandValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Name)
            .Must(n => !string.IsNullOrWhiteSpace(n)).WithMessage(localizer["validation.required", localizer["validation.fields.ledgerItemName"]])
            .MaximumLength(100).WithMessage(localizer["validation.maxLength", localizer["validation.fields.ledgerItemName"], 100]);

        RuleFor(x => x.Direction)
            .IsInEnum().WithMessage(localizer["validation.invalidEnum", localizer["validation.fields.ledgerDirection"]]);

        RuleFor(x => x.OwnerPersonId)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.personId"]])
            .When(x => x.OwnerPersonId.HasValue);
    }
}
