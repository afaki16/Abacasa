using FluentValidation;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Features.RecurringPayments.Common;

namespace Abacasa.Application.Features.RecurringPayments.Commands.UpdateRecurringPayment;

public class UpdateRecurringPaymentCommandValidator : RecurringPaymentFieldsValidator<UpdateRecurringPaymentCommand>
{
    public UpdateRecurringPaymentCommandValidator(IJsonStringLocalizer localizer) : base(localizer)
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.recurringPaymentId"]]);
    }
}
