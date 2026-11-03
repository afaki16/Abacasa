using AutoMapper;
using Abacasa.Application.Interfaces;

namespace Abacasa.Application.Features.Mappings
{
    /// <summary>
    /// Turns a stored file key into its public URL (entities keep keys, DTOs expose URLs).
    /// Usage: opt.MapFrom&lt;FileUrlResolver, string?&gt;(src =&gt; src.ProfileImageKey)
    /// </summary>
    public class FileUrlResolver : IMemberValueResolver<object, object, string?, string?>
    {
        private readonly IFileStorage _fileStorage;

        public FileUrlResolver(IFileStorage fileStorage)
        {
            _fileStorage = fileStorage;
        }

        public string? Resolve(object source, object destination, string? sourceMember, string? destMember, ResolutionContext context)
            => string.IsNullOrEmpty(sourceMember) ? null : _fileStorage.GetPublicUrl(sourceMember);
    }
}
