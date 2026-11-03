using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Households.Common;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Abacasa.API.Filters;

/// <summary>
/// Requires the "donation targets and funds" module of the active household. When it is off every action of the
/// controller returns 403 (same error shape as BaseController.HandleResult). Runs after authorization.
/// </summary>
public class RequireDonationExtrasAttribute : TypeFilterAttribute
{
    public RequireDonationExtrasAttribute() : base(typeof(DonationExtrasFilter))
    {
    }

    private sealed class DonationExtrasFilter : IAsyncActionFilter
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ICurrentUserService _currentUserService;
        private readonly IJsonStringLocalizer _localizer;

        public DonationExtrasFilter(IUnitOfWork unitOfWork, ICurrentUserService currentUserService, IJsonStringLocalizer localizer)
        {
            _unitOfWork = unitOfWork;
            _currentUserService = currentUserService;
            _localizer = localizer;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            if (!await HouseholdModules.IsDonationExtrasEnabledAsync(_unitOfWork, _currentUserService))
            {
                context.Result = new ObjectResult(new
                {
                    success = false,
                    error = ErrorResponse.FromError(HouseholdModules.DisabledError(_localizer))
                })
                { StatusCode = StatusCodes.Status403Forbidden };
                return;
            }

            await next();
        }
    }
}
