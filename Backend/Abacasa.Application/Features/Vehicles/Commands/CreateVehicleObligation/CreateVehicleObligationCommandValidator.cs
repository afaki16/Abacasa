using FluentValidation;
using Abacasa.Application.Common.Localization;

namespace Abacasa.Application.Features.Vehicles.Commands.CreateVehicleObligation;

// Harcamaya bağlı kurallar handler'da (VehicleObligationRules): araç bulunamazsa önce 404 dönmeli
public class CreateVehicleObligationCommandValidator : AbstractValidator<CreateVehicleObligationCommand>
{
    public CreateVehicleObligationCommandValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Type)
            .IsInEnum().WithMessage(localizer["validation.invalidEnum", localizer["validation.fields.obligationType"]]);

        RuleFor(x => x.Date)
            .NotEmpty().WithMessage(localizer["validation.required", localizer["validation.fields.date"]]);

        RuleFor(x => x.ValidUntil)
            .GreaterThan(x => x.Date).WithMessage(localizer["vehicles.validUntilAfterDate"]);

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage(localizer["validation.greaterThan", localizer["validation.fields.amount"], 0])
            .When(x => x.Amount.HasValue);

        RuleFor(x => x.Note)
            .MaximumLength(200).WithMessage(localizer["validation.maxLength", localizer["validation.fields.note"], 200])
            .When(x => !string.IsNullOrEmpty(x.Note));
    }
}
