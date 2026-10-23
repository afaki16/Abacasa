using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Auth.Common;
using Abacasa.Application.Features.Legal.Dtos;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Auth.Commands.AcceptConsents;

public class AcceptConsentsCommandHandler : IRequestHandler<AcceptConsentsCommand, Result<ConsentStatusDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILegalVersions _legalVersions;
    private readonly IJsonStringLocalizer _localizer;

    public AcceptConsentsCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService,
        ILegalVersions legalVersions, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _legalVersions = legalVersions;
        _localizer = localizer;
    }

    public async Task<Result<ConsentStatusDto>> Handle(AcceptConsentsCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId is not int userId)
            return Result<ConsentStatusDto>.Failure(Error.Failure(ErrorCode.Unauthorized, _localizer["auth.userNotAuthenticated"]));

        var documents = new List<LegalDocumentType>();
        foreach (var name in request.DocumentTypes ?? new List<string>())
        {
            if (!Enum.TryParse<LegalDocumentType>(name, ignoreCase: true, out var document) || !Enum.IsDefined(document))
                return Result<ConsentStatusDto>.Failure(Error.Failure(ErrorCode.ValidationFailed, _localizer["legal.invalidDocumentType"]));
            documents.Add(document);
        }

        if (documents.Count == 0)
            return Result<ConsentStatusDto>.Failure(Error.Failure(ErrorCode.ValidationFailed, _localizer["legal.invalidDocumentType"]));

        await LegalConsents.AddAsync(_unitOfWork, _legalVersions, userId, documents);
        await _unitOfWork.SaveChangesAsync();

        return Result<ConsentStatusDto>.Success(new ConsentStatusDto
        {
            PendingConsents = await LegalConsents.GetPendingAsync(_unitOfWork, _legalVersions, userId)
        });
    }
}
