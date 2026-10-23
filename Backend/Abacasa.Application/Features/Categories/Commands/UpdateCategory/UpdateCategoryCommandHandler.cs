using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Categories.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Categories.Commands.UpdateCategory;

public class UpdateCategoryCommandHandler : IRequestHandler<UpdateCategoryCommand, Result<CategoryListDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public UpdateCategoryCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<CategoryListDto>> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        // Tracking'li yükle; başka hanenin kaydı filtre yüzünden bulunamaz
        var category = await _unitOfWork.Categories.GetByIdAsync(request.Id);

        if (category == null)
            return Result<CategoryListDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["categories.notFound"]));

        var name = request.Name.Trim();

        if (await _unitOfWork.Categories.NameExistsAsync(name, request.Id))
            return Result<CategoryListDto>.Failure(Error.Failure(
                ErrorCode.AlreadyExists,
                _localizer["categories.nameExists"]));

        category.Name = name;

        _unitOfWork.Categories.Update(category);
        await _unitOfWork.SaveChangesAsync();

        return Result<CategoryListDto>.Success(_mapper.Map<CategoryListDto>(category));
    }
}
