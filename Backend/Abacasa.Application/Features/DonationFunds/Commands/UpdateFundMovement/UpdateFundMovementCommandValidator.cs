using FluentValidation;
using Abacasa.Application.Common.Localization;

namespace Abacasa.Application.Features.DonationFunds.Commands.UpdateFundMovement;

// Emanet bakiyesine bağlı kurallar handler'da (FundBalance): emanet ya da hareket bulunamazsa önce 404 dönmeli
public class UpdateFundMovementCommandValidator : AbstractValidator<UpdateFundMovementCommand>
{
    public UpdateFundMovementCommandValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Type)
            .IsInEnum().WithMessage(localizer["validation.invalidEnum", localizer["validation.fields.fundMovementType"]]);

        RuleFor(x => x.Date)
            .NotNull().WithMessage(localizer["validation.required", localizer["validation.fields.date"]]);

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage(localizer["validation.greaterThan", localizer["validation.fields.amount"], 0]);

        RuleFor(x => x.Note)
            .MaximumLength(200).WithMessage(localizer["validation.maxLength", localizer["validation.fields.note"], 200])
            .When(x => !string.IsNullOrEmpty(x.Note));
    }
}
