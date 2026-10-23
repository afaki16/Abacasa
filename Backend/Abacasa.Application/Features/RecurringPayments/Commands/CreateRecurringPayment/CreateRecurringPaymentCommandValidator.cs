using Abacasa.Application.Common.Localization;
using Abacasa.Application.Features.RecurringPayments.Common;

namespace Abacasa.Application.Features.RecurringPayments.Commands.CreateRecurringPayment;

public class CreateRecurringPaymentCommandValidator : RecurringPaymentFieldsValidator<CreateRecurringPaymentCommand>
{
    public CreateRecurringPaymentCommandValidator(IJsonStringLocalizer localizer) : base(localizer)
    {
    }
}
