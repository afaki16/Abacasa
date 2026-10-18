using FluentValidation;
using Abacasa.Application.Common.Localization;

namespace Abacasa.Application.Features.Auth.Commands.ResendVerificationEmail
{
    public class ResendVerificationEmailCommandValidator : AbstractValidator<ResendVerificationEmailCommand>
    {
        public ResendVerificationEmailCommandValidator(IJsonStringLocalizer localizer)
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage(localizer["validation.required", localizer["validation.fields.email"]])
                .EmailAddress().WithMessage(localizer["validation.emailFormat"]);
        }
    }
}
