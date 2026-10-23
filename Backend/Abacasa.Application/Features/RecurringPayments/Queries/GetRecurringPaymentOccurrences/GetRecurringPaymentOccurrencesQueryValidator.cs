using FluentValidation;
using Abacasa.Application.Common.Localization;

namespace Abacasa.Application.Features.RecurringPayments.Queries.GetRecurringPaymentOccurrences;

public class GetRecurringPaymentOccurrencesQueryValidator : AbstractValidator<GetRecurringPaymentOccurrencesQuery>
{
    // Başlangıç ve bitiş günü dahil en fazla 366 gün
    private const int MaxRangeDays = 366;

    public GetRecurringPaymentOccurrencesQueryValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.StartDate)
            .NotNull().WithMessage(localizer["validation.required", localizer["validation.fields.startDate"]]);

        RuleFor(x => x.EndDate)
            .NotNull().WithMessage(localizer["validation.required", localizer["validation.fields.endDate"]]);

        When(x => x.StartDate.HasValue && x.EndDate.HasValue, () =>
        {
            RuleFor(x => x)
                .Must(x => x.StartDate!.Value <= x.EndDate!.Value)
                .WithMessage(localizer["recurringPayments.invalidRange"]);

            RuleFor(x => x)
                .Must(x => x.EndDate!.Value.DayNumber - x.StartDate!.Value.DayNumber + 1 <= MaxRangeDays)
                .WithMessage(localizer["recurringPayments.rangeTooLong", MaxRangeDays]);
        });
    }
}
