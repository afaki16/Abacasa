using FluentValidation;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Pagination;

namespace Abacasa.Application.Features.Debts.Queries.GetAllDebts;

public class GetAllDebtsQueryValidator : AbstractValidator<GetAllDebtsQuery>
{
    public GetAllDebtsQueryValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(PaginationLimits.MinPage)
            .WithMessage(localizer["validation.minValue", localizer["validation.fields.page"], PaginationLimits.MinPage]);

        RuleFor(x => x.PageSize)
            .InclusiveBetween(PaginationLimits.MinPageSize, PaginationLimits.MaxDebtsPageSize)
            .WithMessage(localizer["validation.range", localizer["validation.fields.pageSize"], PaginationLimits.MinPageSize, PaginationLimits.MaxDebtsPageSize]);

        RuleFor(x => x.Currency)
            .IsInEnum().WithMessage(localizer["validation.invalidEnum", localizer["validation.fields.currency"]])
            .When(x => x.Currency.HasValue);
    }
}
