using FluentValidation;
using Abacasa.Application.Common.Localization;
using Abacasa.Domain.Common.Enums;

namespace Abacasa.Application.Features.PaymentMethods.Commands.UpdatePaymentMethod;

public class UpdatePaymentMethodCommandValidator : AbstractValidator<UpdatePaymentMethodCommand>
{
    public UpdatePaymentMethodCommandValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.paymentMethodId"]]);

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(localizer["validation.required", localizer["validation.fields.paymentMethodName"]])
            .MaximumLength(100).WithMessage(localizer["validation.maxLength", localizer["validation.fields.paymentMethodName"], 100]);

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage(localizer["validation.invalidEnum", localizer["validation.fields.paymentMethodType"]]);

        RuleFor(x => x.Bank)
            .MaximumLength(100).WithMessage(localizer["validation.maxLength", localizer["validation.fields.bank"], 100])
            .When(x => !string.IsNullOrEmpty(x.Bank));

        RuleFor(x => x.OwnerPersonId)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.personId"]])
            .When(x => x.OwnerPersonId.HasValue);

        // Kredi kartında kesim günü zorunlu (1–31); diğer türlerde boş olmalı
        When(x => x.Type == PaymentMethodType.CreditCard, () =>
        {
            RuleFor(x => x.StatementDay)
                .NotNull().WithMessage(localizer["validation.required", localizer["validation.fields.statementDay"]])
                .InclusiveBetween(1, 31).WithMessage(localizer["validation.range", localizer["validation.fields.statementDay"], 1, 31]);
        }).Otherwise(() =>
        {
            RuleFor(x => x.StatementDay)
                .Null().WithMessage(localizer["paymentMethods.statementDayOnlyForCreditCard"]);
        });
    }
}
