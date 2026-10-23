using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.People.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.People.Commands.UpdatePerson;

public class UpdatePersonCommandHandler : IRequestHandler<UpdatePersonCommand, Result<PersonListDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public UpdatePersonCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<PersonListDto>> Handle(UpdatePersonCommand request, CancellationToken cancellationToken)
    {
        // Tracking'li yükle; başka hanenin kaydı filtre yüzünden bulunamaz
        var person = await _unitOfWork.People.GetByIdAsync(request.Id);

        if (person == null)
            return Result<PersonListDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["people.notFound"]));

        var name = request.Name.Trim();

        if (await _unitOfWork.People.NameExistsAsync(name, request.Id))
            return Result<PersonListDto>.Failure(Error.Failure(
                ErrorCode.AlreadyExists,
                _localizer["people.nameExists"]));

        person.Name = name;
        person.Relation = string.IsNullOrWhiteSpace(request.Relation) ? null : request.Relation.Trim();

        _unitOfWork.People.Update(person);
        await _unitOfWork.SaveChangesAsync();

        return Result<PersonListDto>.Success(_mapper.Map<PersonListDto>(person));
    }
}
