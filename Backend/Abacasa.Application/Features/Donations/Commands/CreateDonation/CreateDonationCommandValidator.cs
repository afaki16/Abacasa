using FluentValidation;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Features.Donations.Common;

namespace Abacasa.Application.Features.Donations.Commands.CreateDonation;

public class CreateDonationCommandValidator : AbstractValidator<CreateDonationCommand>
{
    public CreateDonationCommandValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Date)
            .NotEmpty().WithMessage(localizer["validation.required", localizer["validation.fields.donationDate"]]);

        this.AddCurrencyRules(localizer);

        RuleFor(x => x.Kind)
            .IsInEnum().WithMessage(localizer["validation.invalidEnum", localizer["validation.fields.donationKind"]]);

        RuleFor(x => x.Recipient)
            .Must(r => !string.IsNullOrWhiteSpace(r)).WithMessage(localizer["validation.required", localizer["validation.fields.recipient"]])
            .MaximumLength(100).WithMessage(localizer["validation.maxLength", localizer["validation.fields.recipient"], 100]);

        RuleFor(x => x.Note)
            .MaximumLength(200).WithMessage(localizer["validation.maxLength", localizer["validation.fields.note"], 200])
            .When(x => !string.IsNullOrEmpty(x.Note));

        RuleFor(x => x.PaymentMethodId)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.paymentMethod"]]);

        RuleFor(x => x.GiverPersonId)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.personId"]])
            .When(x => x.GiverPersonId.HasValue);

        RuleFor(x => x.FundId)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.fundId"]])
            .When(x => x.FundId.HasValue);
    }
}
