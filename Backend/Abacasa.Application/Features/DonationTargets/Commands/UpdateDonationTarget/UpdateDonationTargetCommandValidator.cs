using FluentValidation;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Features.DonationTargets.Common;

namespace Abacasa.Application.Features.DonationTargets.Commands.UpdateDonationTarget;

public class UpdateDonationTargetCommandValidator : AbstractValidator<UpdateDonationTargetCommand>
{
    public UpdateDonationTargetCommandValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.targetId"]]);

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage(localizer["validation.greaterThan", localizer["validation.fields.amount"], 0]);

        RuleFor(x => x.Year)
            .InclusiveBetween(DonationTargetRules.MinYear, DonationTargetRules.MaxYear)
            .WithMessage(localizer["validation.range", localizer["validation.fields.year"], DonationTargetRules.MinYear, DonationTargetRules.MaxYear]);

        RuleFor(x => x.Kind)
            .IsInEnum().WithMessage(localizer["validation.invalidEnum", localizer["validation.fields.donationKind"]]);

        RuleFor(x => x.OwnerPersonId)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.personId"]])
            .When(x => x.OwnerPersonId.HasValue);

        RuleFor(x => x.Note)
            .MaximumLength(200).WithMessage(localizer["validation.maxLength", localizer["validation.fields.note"], 200])
            .When(x => !string.IsNullOrEmpty(x.Note));
    }
}
