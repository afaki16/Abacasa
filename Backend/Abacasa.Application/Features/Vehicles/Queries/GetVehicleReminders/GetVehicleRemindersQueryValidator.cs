using FluentValidation;
using Abacasa.Application.Common.Localization;

namespace Abacasa.Application.Features.Vehicles.Queries.GetVehicleReminders;

public class GetVehicleRemindersQueryValidator : AbstractValidator<GetVehicleRemindersQuery>
{
    public GetVehicleRemindersQueryValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Today)
            .NotNull().WithMessage(localizer["validation.required", localizer["validation.fields.today"]]);
    }
}
