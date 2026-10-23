using FluentValidation;
using Abacasa.Application.Common.Localization;

namespace Abacasa.Application.Features.Donations.Queries.GetDonationSummary;

public class GetDonationSummaryQueryValidator : AbstractValidator<GetDonationSummaryQuery>
{
    public GetDonationSummaryQueryValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Kind)
            .IsInEnum().WithMessage(localizer["validation.invalidEnum", localizer["validation.fields.donationKind"]])
            .When(x => x.Kind.HasValue);
    }
}
