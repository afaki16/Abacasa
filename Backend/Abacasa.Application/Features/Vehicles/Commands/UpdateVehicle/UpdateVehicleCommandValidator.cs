using FluentValidation;
using Abacasa.Application.Common.Localization;

namespace Abacasa.Application.Features.Vehicles.Commands.UpdateVehicle;

public class UpdateVehicleCommandValidator : AbstractValidator<UpdateVehicleCommand>
{
    public UpdateVehicleCommandValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.vehicleId"]]);

        RuleFor(x => x.Name)
            .Must(n => !string.IsNullOrWhiteSpace(n)).WithMessage(localizer["validation.required", localizer["validation.fields.vehicleName"]])
            .MaximumLength(100).WithMessage(localizer["validation.maxLength", localizer["validation.fields.vehicleName"], 100]);

        RuleFor(x => x.Plate)
            .Must(p => !string.IsNullOrWhiteSpace(p)).WithMessage(localizer["validation.required", localizer["validation.fields.plate"]])
            .MaximumLength(20).WithMessage(localizer["validation.maxLength", localizer["validation.fields.plate"], 20]);

        RuleFor(x => x.OwnerPersonId)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.personId"]])
            .When(x => x.OwnerPersonId.HasValue);

        RuleFor(x => x.Note)
            .MaximumLength(200).WithMessage(localizer["validation.maxLength", localizer["validation.fields.note"], 200])
            .When(x => !string.IsNullOrEmpty(x.Note));
    }
}
