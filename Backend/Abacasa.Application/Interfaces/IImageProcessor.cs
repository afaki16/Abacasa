namespace Abacasa.Application.Interfaces
{
    public sealed record ProcessedImage(byte[] Content, string ContentType, string Extension);

    /// <summary>
    /// Validates and re-encodes uploaded images. The type is detected from the file content
    /// (JPEG, PNG, WEBP only — never the client's Content-Type), and re-encoding drops
    /// everything except the pixels: EXIF (GPS location), embedded data and scripts.
    /// </summary>
    public interface IImageProcessor
    {
        /// <summary>
        /// Square avatar: honours EXIF orientation, centre-crops, scales down to at most
        /// <paramref name="size"/> pixels and encodes as WEBP. Returns null when the content
        /// is not a supported image (or is unreasonably large in pixels).
        /// </summary>
        ProcessedImage? CreateAvatar(Stream input, int size = 512);
    }
}
