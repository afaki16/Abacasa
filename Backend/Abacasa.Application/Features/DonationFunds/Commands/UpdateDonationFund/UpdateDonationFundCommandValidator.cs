using FluentValidation;
using Abacasa.Application.Common.Localization;

namespace Abacasa.Application.Features.DonationFunds.Commands.UpdateDonationFund;

public class UpdateDonationFundCommandValidator : AbstractValidator<UpdateDonationFundCommand>
{
    public UpdateDonationFundCommandValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.fundId"]]);

        RuleFor(x => x.FromPersonId)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.fromPerson"]]);

        RuleFor(x => x.Kind)
            .IsInEnum().WithMessage(localizer["validation.invalidEnum", localizer["validation.fields.donationKind"]]);

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage(localizer["validation.greaterThan", localizer["validation.fields.amount"], 0]);

        RuleFor(x => x.Date)
            .NotEmpty().WithMessage(localizer["validation.required", localizer["validation.fields.date"]]);

        RuleFor(x => x.Note)
            .MaximumLength(200).WithMessage(localizer["validation.maxLength", localizer["validation.fields.note"], 200])
            .When(x => !string.IsNullOrEmpty(x.Note));
    }
}
