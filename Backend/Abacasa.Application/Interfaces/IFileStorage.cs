namespace Abacasa.Application.Interfaces
{
    /// <summary>
    /// Where uploaded files live. Storage:Provider picks the implementation:
    /// "Local" (default, server disk served at /uploads) or "S3" (any S3-compatible service:
    /// Cloudflare R2, Hetzner, Backblaze B2, AWS S3, MinIO).
    /// Persist only the key (e.g. "users/5/avatar-….webp"), never the URL:
    /// switching providers then means copying the files and changing configuration.
    /// </summary>
    public interface IFileStorage
    {
        Task SaveAsync(string key, Stream content, string contentType, CancellationToken cancellationToken = default);

        /// <summary>Deleting a missing key is not an error.</summary>
        Task DeleteAsync(string key, CancellationToken cancellationToken = default);

        /// <summary>
        /// Public URL of a stored file. Local returns a path ("/uploads/…") that clients resolve
        /// against the API origin; S3 returns Storage:S3:PublicBaseUrl + key.
        /// </summary>
        string GetPublicUrl(string key);
    }
}
