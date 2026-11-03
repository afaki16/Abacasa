using Abacasa.Application.Common.Authorization;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Abacasa.Application.Features.Users.Commands.UserPhoto
{
    public class UserPhotoCommandHandlers :
        IRequestHandler<SetUserPhotoCommand, Result<UserPhotoDto>>,
        IRequestHandler<RemoveUserPhotoCommand, Result<UserPhotoDto>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ICurrentUserService _currentUserService;
        private readonly IPermissionService _permissionService;
        private readonly IFileStorage _fileStorage;
        private readonly IImageProcessor _imageProcessor;
        private readonly IJsonStringLocalizer _localizer;
        private readonly ILogger<UserPhotoCommandHandlers> _logger;

        public UserPhotoCommandHandlers(
            IUnitOfWork unitOfWork,
            ICurrentUserService currentUserService,
            IPermissionService permissionService,
            IFileStorage fileStorage,
            IImageProcessor imageProcessor,
            IJsonStringLocalizer localizer,
            ILogger<UserPhotoCommandHandlers> logger)
        {
            _unitOfWork = unitOfWork;
            _currentUserService = currentUserService;
            _permissionService = permissionService;
            _fileStorage = fileStorage;
            _imageProcessor = imageProcessor;
            _localizer = localizer;
            _logger = logger;
        }

        public async Task<Result<UserPhotoDto>> Handle(SetUserPhotoCommand request, CancellationToken cancellationToken)
        {
            var (user, error) = await LoadAccessibleUserAsync(request.UserId);
            if (error != null)
                return Result<UserPhotoDto>.Failure(error);

            if (request.Length <= 0)
                return Result<UserPhotoDto>.Failure(Error.Failure(ErrorCode.ValidationFailed, _localizer["files.missing"]));
            if (request.Length > SetUserPhotoCommand.MaxBytes)
                return Result<UserPhotoDto>.Failure(Error.Failure(ErrorCode.ValidationFailed,
                    _localizer["files.tooLarge", SetUserPhotoCommand.MaxBytes / (1024 * 1024)]));

            // Re-encoding keeps only the pixels: no EXIF/GPS, no embedded payloads
            var image = _imageProcessor.CreateAvatar(request.Content);
            if (image == null)
                return Result<UserPhotoDto>.Failure(Error.Failure(ErrorCode.ValidationFailed, _localizer["files.invalidImage"]));

            // Kullanıcı globaldir (birden çok haneye üye olabilir): anahtar haneye değil kullanıcıya bağlı
            var key = $"users/{user!.Id}/avatar-{Guid.NewGuid():N}.{image.Extension}";

            try
            {
                using var content = new MemoryStream(image.Content);
                await _fileStorage.SaveAsync(key, content, image.ContentType, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Profile photo upload failed for user {UserId}", user.Id);
                return Result<UserPhotoDto>.Failure(Error.Failure(ErrorCode.InternalError, _localizer["files.uploadFailed"]));
            }

            // Old file is deleted only after the new one is saved; deleting first would leave
            // a broken photo whenever the upload or the save failed.
            var oldKey = user.ProfileImageKey;
            user.ProfileImageKey = key;
            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            await DeleteBestEffortAsync(oldKey, user.Id, cancellationToken);

            return Result<UserPhotoDto>.Success(new UserPhotoDto { ProfileImageUrl = _fileStorage.GetPublicUrl(key) });
        }

        public async Task<Result<UserPhotoDto>> Handle(RemoveUserPhotoCommand request, CancellationToken cancellationToken)
        {
            var (user, error) = await LoadAccessibleUserAsync(request.UserId);
            if (error != null)
                return Result<UserPhotoDto>.Failure(error);

            var oldKey = user!.ProfileImageKey;
            if (oldKey != null)
            {
                user.ProfileImageKey = null;
                _unitOfWork.Users.Update(user);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                await DeleteBestEffortAsync(oldKey, user.Id, cancellationToken);
            }

            return Result<UserPhotoDto>.Success(new UserPhotoDto { ProfileImageUrl = null });
        }

        /// <summary>Own photo is always allowed; someone else's needs the same rights as editing that user.</summary>
        private async Task<(User? User, Error? Error)> LoadAccessibleUserAsync(int? requestedUserId)
        {
            var userId = requestedUserId ?? _currentUserService.UserId;
            if (userId == null)
                return (null, Error.Failure(ErrorCode.Unauthorized, _localizer["auth.userNotAuthenticated"]));

            var user = await _unitOfWork.Users.GetUserWithRolesAsync(userId.Value);
            if (user == null)
                return (null, Error.Failure(ErrorCode.NotFound, _localizer["users.notFound"]));

            if (user.Id == _currentUserService.UserId)
                return (user, null);

            if (!TenantAccess.CanAccessTenant(_currentUserService, user.TenantId) ||
                TenantAdminVisibility.IsHiddenFromTenantAdmin(_currentUserService, user))
                return (null, Error.Failure(ErrorCode.Forbidden, _localizer["users.noAccessToUpdate"]));

            // Caller cannot manage a user whose roles exceed the caller's own permissions
            var targetRoleError = await RoleAssignmentGuard.ValidateAsync(
                user.UserRoles.Select(ur => ur.RoleId), user.TenantId, _unitOfWork, _currentUserService, _permissionService, _localizer);
            if (targetRoleError != null)
                return (null, Error.Failure(ErrorCode.Forbidden, _localizer["users.noAccessToUpdate"]));

            return (user, null);
        }

        // A leftover file is harmless; a failed delete must not fail the request
        private async Task DeleteBestEffortAsync(string? key, int userId, CancellationToken cancellationToken)
        {
            if (string.IsNullOrEmpty(key))
                return;
            try
            {
                await _fileStorage.DeleteAsync(key, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete old profile photo {Key} for user {UserId}", key, userId);
            }
        }
    }
}
