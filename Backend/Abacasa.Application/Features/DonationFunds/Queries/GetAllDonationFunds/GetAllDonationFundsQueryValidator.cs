using FluentValidation;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Pagination;

namespace Abacasa.Application.Features.DonationFunds.Queries.GetAllDonationFunds;

public class GetAllDonationFundsQueryValidator : AbstractValidator<GetAllDonationFundsQuery>
{
    public GetAllDonationFundsQueryValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(PaginationLimits.MinPage)
            .WithMessage(localizer["validation.minValue", localizer["validation.fields.page"], PaginationLimits.MinPage]);

        RuleFor(x => x.PageSize)
            .InclusiveBetween(PaginationLimits.MinPageSize, PaginationLimits.MaxDonationFundsPageSize)
            .WithMessage(localizer["validation.range", localizer["validation.fields.pageSize"], PaginationLimits.MinPageSize, PaginationLimits.MaxDonationFundsPageSize]);
    }
}
