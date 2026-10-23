using FluentValidation;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Pagination;

namespace Abacasa.Application.Features.Ledger.Queries.GetAllLedgerItems;

public class GetAllLedgerItemsQueryValidator : AbstractValidator<GetAllLedgerItemsQuery>
{
    public GetAllLedgerItemsQueryValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(PaginationLimits.MinPage)
            .WithMessage(localizer["validation.minValue", localizer["validation.fields.page"], PaginationLimits.MinPage]);

        RuleFor(x => x.PageSize)
            .InclusiveBetween(PaginationLimits.MinPageSize, PaginationLimits.MaxLedgerItemsPageSize)
            .WithMessage(localizer["validation.range", localizer["validation.fields.pageSize"], PaginationLimits.MinPageSize, PaginationLimits.MaxLedgerItemsPageSize]);

        RuleFor(x => x.Direction)
            .IsInEnum().WithMessage(localizer["validation.invalidEnum", localizer["validation.fields.ledgerDirection"]])
            .When(x => x.Direction.HasValue);
    }
}
