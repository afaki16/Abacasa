using FluentValidation;
using Abacasa.Application.Common.Localization;

namespace Abacasa.Application.Features.Auth.Commands.UpdateProfile
{
    public class UpdateProfileCommandValidator : AbstractValidator<UpdateProfileCommand>
    {
        // Kayıttaki kurallarla aynı (RegisterCommandValidator): kullanıcı adını kayıtta kabul edilmeyen biçime getiremesin
        public UpdateProfileCommandValidator(IJsonStringLocalizer localizer)
        {
            const string NameRegex = @"^[\p{L}\p{M}\s.'\-]+$";

            RuleFor(x => x.FirstName)
                .NotEmpty().WithMessage(localizer["validation.required", localizer["validation.fields.firstName"]])
                .MaximumLength(50).WithMessage(localizer["validation.maxLength", localizer["validation.fields.firstName"], 50])
                .Matches(NameRegex).WithMessage(localizer["validation.nameFormat", localizer["validation.fields.firstName"]]);

            RuleFor(x => x.LastName)
                .NotEmpty().WithMessage(localizer["validation.required", localizer["validation.fields.lastName"]])
                .MaximumLength(50).WithMessage(localizer["validation.maxLength", localizer["validation.fields.lastName"], 50])
                .Matches(NameRegex).WithMessage(localizer["validation.nameFormat", localizer["validation.fields.lastName"]]);

            RuleFor(x => x.PhoneNumber)
                .MaximumLength(20).WithMessage(localizer["validation.maxLength", localizer["validation.fields.phoneNumber"], 20])
                .When(x => !string.IsNullOrEmpty(x.PhoneNumber));
        }
    }
}
