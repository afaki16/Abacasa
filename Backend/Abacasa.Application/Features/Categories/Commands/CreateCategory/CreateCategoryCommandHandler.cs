using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Categories.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Categories.Commands.CreateCategory;

public class CreateCategoryCommandHandler : IRequestHandler<CreateCategoryCommand, Result<CategoryListDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public CreateCategoryCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<CategoryListDto>> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();

        // Tenant filtresi ApplicationDbContext'te: kontrol sadece kullanıcının hanesinde yapılır
        if (await _unitOfWork.Categories.NameExistsAsync(name))
            return Result<CategoryListDto>.Failure(Error.Failure(
                ErrorCode.AlreadyExists,
                _localizer["categories.nameExists"]));

        // TenantId ApplicationDbContext tarafından atanır
        var category = new Category { Name = name };

        await _unitOfWork.Categories.AddAsync(category);
        await _unitOfWork.SaveChangesAsync();

        return Result<CategoryListDto>.Success(_mapper.Map<CategoryListDto>(category));
    }
}
