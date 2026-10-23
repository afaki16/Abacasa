using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.People.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.People.Commands.CreatePerson;

public class CreatePersonCommandHandler : IRequestHandler<CreatePersonCommand, Result<PersonListDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public CreatePersonCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<PersonListDto>> Handle(CreatePersonCommand request, CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();

        // Tenant filtresi ApplicationDbContext'te: kontrol sadece kullanıcının hanesinde yapılır
        if (await _unitOfWork.People.NameExistsAsync(name))
            return Result<PersonListDto>.Failure(Error.Failure(
                ErrorCode.AlreadyExists,
                _localizer["people.nameExists"]));

        // TenantId ApplicationDbContext tarafından atanır
        var person = new Person
        {
            Name = name,
            Relation = string.IsNullOrWhiteSpace(request.Relation) ? null : request.Relation.Trim()
        };

        await _unitOfWork.People.AddAsync(person);
        await _unitOfWork.SaveChangesAsync();

        return Result<PersonListDto>.Success(_mapper.Map<PersonListDto>(person));
    }
}
