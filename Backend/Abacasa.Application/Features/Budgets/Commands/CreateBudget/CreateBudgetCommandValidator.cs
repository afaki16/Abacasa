using FluentValidation;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Features.Budgets.Common;

namespace Abacasa.Application.Features.Budgets.Commands.CreateBudget;

public class CreateBudgetCommandValidator : AbstractValidator<CreateBudgetCommand>
{
    public CreateBudgetCommandValidator(IJsonStringLocalizer localizer)
    {
        // 0: bu aydan itibaren bütçe yok
        RuleFor(x => x.Amount)
            .GreaterThanOrEqualTo(0).WithMessage(localizer["validation.minValue", localizer["validation.fields.amount"], 0]);

        RuleFor(x => x.StartYear)
            .InclusiveBetween(BudgetRules.MinYear, BudgetRules.MaxYear)
            .WithMessage(localizer["validation.range", localizer["validation.fields.year"], BudgetRules.MinYear, BudgetRules.MaxYear]);

        RuleFor(x => x.StartMonth)
            .InclusiveBetween(1, 12)
            .WithMessage(localizer["validation.range", localizer["validation.fields.month"], 1, 12]);

        RuleFor(x => x.OwnerPersonId)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.personId"]])
            .When(x => x.OwnerPersonId.HasValue);

        RuleFor(x => x.Note)
            .MaximumLength(200).WithMessage(localizer["validation.maxLength", localizer["validation.fields.note"], 200])
            .When(x => !string.IsNullOrEmpty(x.Note));
    }
}
