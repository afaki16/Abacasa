using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.Users.Commands.UserPhoto
{
    public class UserPhotoDto
    {
        public string? ProfileImageUrl { get; set; }
    }

    /// <summary>Uploads (or replaces) a user's profile photo. Used for the caller's own photo and by admins.</summary>
    public class SetUserPhotoCommand : IRequest<Result<UserPhotoDto>>
    {
        // Phone photos are often 3–8 MB; the stored result is a small 512 px WEBP anyway
        public const long MaxBytes = 10 * 1024 * 1024;

        /// <summary>Null = the signed-in user.</summary>
        public int? UserId { get; set; }
        public Stream Content { get; set; } = Stream.Null;
        public long Length { get; set; }
    }

    public class RemoveUserPhotoCommand : IRequest<Result<UserPhotoDto>>
    {
        /// <summary>Null = the signed-in user.</summary>
        public int? UserId { get; set; }
    }
}
