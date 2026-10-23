using FluentValidation;
using Abacasa.Application.Common.Localization;

namespace Abacasa.Application.Features.Dashboard.Queries.GetDashboard;

public class GetDashboardQueryValidator : AbstractValidator<GetDashboardQuery>
{
    // Başlangıç ve bitiş günü dahil en fazla 366 gün (sabit ödeme vadeleriyle aynı)
    private const int MaxRangeDays = 366;

    public GetDashboardQueryValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.StartDate)
            .NotNull().WithMessage(localizer["validation.required", localizer["validation.fields.startDate"]]);

        RuleFor(x => x.EndDate)
            .NotNull().WithMessage(localizer["validation.required", localizer["validation.fields.endDate"]]);

        RuleFor(x => x.Today)
            .NotNull().WithMessage(localizer["validation.required", localizer["validation.fields.today"]]);

        When(x => x.StartDate.HasValue && x.EndDate.HasValue, () =>
        {
            RuleFor(x => x)
                .Must(x => x.StartDate!.Value <= x.EndDate!.Value)
                .WithMessage(localizer["dashboard.invalidRange"]);

            RuleFor(x => x)
                .Must(x => x.EndDate!.Value.DayNumber - x.StartDate!.Value.DayNumber + 1 <= MaxRangeDays)
                .WithMessage(localizer["dashboard.rangeTooLong", MaxRangeDays]);
        });
    }
}
