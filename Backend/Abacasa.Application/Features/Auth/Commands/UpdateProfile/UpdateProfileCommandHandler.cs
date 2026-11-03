using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Abacasa.Application.Features.Auth.Commands.UpdateProfile
{
    public class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, Result>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ICurrentUserService _currentUserService;
        private readonly ILogger<UpdateProfileCommandHandler> _logger;
        private readonly IJsonStringLocalizer _localizer;
        private readonly IPhoneNumberService _phoneNumberService;

        public UpdateProfileCommandHandler(
            IUnitOfWork unitOfWork,
            ICurrentUserService currentUserService,
            ILogger<UpdateProfileCommandHandler> logger,
            IJsonStringLocalizer localizer,
            IPhoneNumberService phoneNumberService)
        {
            _phoneNumberService = phoneNumberService;
            _unitOfWork = unitOfWork;
            _currentUserService = currentUserService;
            _logger = logger;
            _localizer = localizer;
        }

        public async Task<Result> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
        {
            var userId = _currentUserService.UserId;
            if (!userId.HasValue)
                return Result.Failure(Error.Failure(ErrorCode.Unauthorized, _localizer["auth.userNotAuthenticated"]));

            var user = await _unitOfWork.Users.GetByIdAsync(userId.Value);
            if (user is null)
                return Result.Failure(Error.Failure(ErrorCode.NotFound, _localizer["users.notFound"]));

            // Telefon tüm sistemde benzersiz: E.164 biçimiyle kontrol edilir ve saklanır; geçersiz numara 400
            var phoneResult = _phoneNumberService.Normalize(request.PhoneNumber);
            if (!phoneResult.IsSuccess)
                return Result.Failure(phoneResult.Errors);
            var phone = phoneResult.Value;
            if (phone != null && phone != user.PhoneNumber &&
                await _unitOfWork.Users.PhoneExistsAsync(phone, user.Id))
                return Result.Failure(Error.Failure(ErrorCode.AlreadyExists, _localizer["users.phoneExists"]));

            user.FirstName = request.FirstName.Trim();
            user.LastName = request.LastName.Trim();
            if (phone != user.PhoneNumber)
            {
                user.PhoneNumber = phone;
                // A new number has not been verified yet
                user.PhoneConfirmed = false;
            }

            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Profile updated by user. UserId: {UserId}", user.Id);
            return Result.Success();
        }
    }
}
