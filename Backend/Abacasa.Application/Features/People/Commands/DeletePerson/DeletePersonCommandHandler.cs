using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.People.Commands.DeletePerson;

public class DeletePersonCommandHandler : IRequestHandler<DeletePersonCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJsonStringLocalizer _localizer;

    public DeletePersonCommandHandler(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<bool>> Handle(DeletePersonCommand request, CancellationToken cancellationToken)
    {
        var person = await _unitOfWork.People.GetByIdAsync(request.Id);

        if (person == null)
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["people.notFound"]));

        // Bir ödeme aracının sahibi ya da bir harcamanın kişisi olan kişi silinemez
        if (await _unitOfWork.People.IsInUseAsync(person.Id))
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.InvalidOperation,
                _localizer["people.inUse"],
                409));

        _unitOfWork.People.SoftDelete(person);
        await _unitOfWork.SaveChangesAsync();

        return Result<bool>.Success(true);
    }
}
