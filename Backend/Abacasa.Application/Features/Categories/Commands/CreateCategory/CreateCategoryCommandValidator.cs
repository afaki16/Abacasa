using FluentValidation;
using Abacasa.Application.Common.Localization;

namespace Abacasa.Application.Features.Categories.Commands.CreateCategory;

public class CreateCategoryCommandValidator : AbstractValidator<CreateCategoryCommand>
{
    public CreateCategoryCommandValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(localizer["validation.required", localizer["validation.fields.categoryName"]])
            .MaximumLength(100).WithMessage(localizer["validation.maxLength", localizer["validation.fields.categoryName"], 100]);
    }
}
