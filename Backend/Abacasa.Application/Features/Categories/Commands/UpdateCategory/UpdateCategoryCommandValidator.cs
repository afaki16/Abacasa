using FluentValidation;
using Abacasa.Application.Common.Localization;

namespace Abacasa.Application.Features.Categories.Commands.UpdateCategory;

public class UpdateCategoryCommandValidator : AbstractValidator<UpdateCategoryCommand>
{
    public UpdateCategoryCommandValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.categoryId"]]);

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(localizer["validation.required", localizer["validation.fields.categoryName"]])
            .MaximumLength(100).WithMessage(localizer["validation.maxLength", localizer["validation.fields.categoryName"], 100]);
    }
}
