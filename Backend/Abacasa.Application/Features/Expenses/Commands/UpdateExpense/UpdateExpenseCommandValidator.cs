using FluentValidation;
using Abacasa.Application.Common.Localization;

namespace Abacasa.Application.Features.Expenses.Commands.UpdateExpense;

public class UpdateExpenseCommandValidator : AbstractValidator<UpdateExpenseCommand>
{
    public UpdateExpenseCommandValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.expenseId"]]);

        RuleFor(x => x.Date)
            .NotEmpty().WithMessage(localizer["validation.required", localizer["validation.fields.expenseDate"]]);

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage(localizer["validation.greaterThan", localizer["validation.fields.amount"], 0]);

        RuleFor(x => x.Description)
            .MaximumLength(200).WithMessage(localizer["validation.maxLength", localizer["validation.fields.description"], 200])
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.CategoryId)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.category"]]);

        RuleFor(x => x.PaymentMethodId)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.paymentMethod"]]);

        RuleFor(x => x.OwnerPersonId)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.personId"]])
            .When(x => x.OwnerPersonId.HasValue);
    }
}
