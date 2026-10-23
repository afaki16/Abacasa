using FluentValidation;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Features.DonationTargets.Common;

namespace Abacasa.Application.Features.DonationTargets.Queries.GetDonationTargetReport;

public class GetDonationTargetReportQueryValidator : AbstractValidator<GetDonationTargetReportQuery>
{
    public GetDonationTargetReportQueryValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Year)
            .InclusiveBetween(DonationTargetRules.MinYear, DonationTargetRules.MaxYear)
            .WithMessage(localizer["validation.range", localizer["validation.fields.year"], DonationTargetRules.MinYear, DonationTargetRules.MaxYear]);

        RuleFor(x => x.Today)
            .NotNull().WithMessage(localizer["validation.required", localizer["validation.fields.today"]]);
    }
}
