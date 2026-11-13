using FluentValidation;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Features.Budgets.Common;

namespace Abacasa.Application.Features.Budgets.Queries.GetBudgetReport;

public class GetBudgetReportQueryValidator : AbstractValidator<GetBudgetReportQuery>
{
    public GetBudgetReportQueryValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Year)
            .InclusiveBetween(BudgetRules.MinYear, BudgetRules.MaxYear)
            .WithMessage(localizer["validation.range", localizer["validation.fields.year"], BudgetRules.MinYear, BudgetRules.MaxYear]);

        RuleFor(x => x.Month)
            .InclusiveBetween(1, 12)
            .WithMessage(localizer["validation.range", localizer["validation.fields.month"], 1, 12]);

        RuleFor(x => x.Today)
            .NotNull().WithMessage(localizer["validation.required", localizer["validation.fields.today"]]);
    }
}
