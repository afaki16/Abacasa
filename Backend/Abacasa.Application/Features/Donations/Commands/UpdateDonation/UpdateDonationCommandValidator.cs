using FluentValidation;
using Abacasa.Application.Common.Localization;

namespace Abacasa.Application.Features.Donations.Commands.UpdateDonation;

public class UpdateDonationCommandValidator : AbstractValidator<UpdateDonationCommand>
{
    public UpdateDonationCommandValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.donationId"]]);

        RuleFor(x => x.Date)
            .NotEmpty().WithMessage(localizer["validation.required", localizer["validation.fields.donationDate"]]);

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage(localizer["validation.greaterThan", localizer["validation.fields.amount"], 0]);

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
