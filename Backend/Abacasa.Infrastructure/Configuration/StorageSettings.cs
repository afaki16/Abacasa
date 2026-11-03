namespace Abacasa.Infrastructure.Configuration
{
    /// <summary>"Storage" section. Provider: "Local" (default) or "S3".</summary>
    public class StorageSettings
    {
        public const string LocalProvider = "Local";
        public const string S3Provider = "S3";

        public string Provider { get; set; } = LocalProvider;
        public LocalStorageSettings Local { get; set; } = new();
        public S3StorageSettings S3 { get; set; } = new();

        public bool IsS3 => string.Equals(Provider, S3Provider, StringComparison.OrdinalIgnoreCase);
    }

    public class LocalStorageSettings
    {
        /// <summary>Folder on disk; relative paths are resolved against the app's content root.
        /// In Docker, mount it as a volume so files survive redeploys.</summary>
        public string Path { get; set; } = "storage/uploads";

        /// <summary>URL path the files are served under.</summary>
        public string RequestPath { get; set; } = "/uploads";
    }

    public class S3StorageSettings
    {
        /// <summary>Endpoint, e.g. https://&lt;account&gt;.r2.cloudflarestorage.com. Empty = AWS S3 (uses Region).</summary>
        public string ServiceUrl { get; set; } = "";
        public string Region { get; set; } = "auto";
        public string Bucket { get; set; } = "";
        public string AccessKey { get; set; } = "";
        public string SecretKey { get; set; } = "";

        /// <summary>Public base URL of the bucket (custom domain or the provider's public URL),
        /// e.g. https://files.example.com. Keys are appended to it.</summary>
        public string PublicBaseUrl { get; set; } = "";

        /// <summary>Path-style addressing; needed by MinIO and most self-hosted servers.</summary>
        public bool ForcePathStyle { get; set; }
    }
}
