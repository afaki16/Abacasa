using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Abacasa.Application.Interfaces;
using Abacasa.Infrastructure.Configuration;

namespace Abacasa.Infrastructure.Services.Storage
{
    /// <summary>
    /// Any S3-compatible service: Cloudflare R2, Hetzner Object Storage, Backblaze B2, AWS S3, MinIO.
    /// The bucket (or its custom domain) must allow public reads; files are served from PublicBaseUrl.
    /// </summary>
    public class S3FileStorage : IFileStorage, IDisposable
    {
        private readonly AmazonS3Client _client;
        private readonly S3StorageSettings _settings;
        private readonly string _publicBaseUrl;

        public S3FileStorage(S3StorageSettings settings)
        {
            if (string.IsNullOrWhiteSpace(settings.Bucket)
                || string.IsNullOrWhiteSpace(settings.AccessKey)
                || string.IsNullOrWhiteSpace(settings.SecretKey)
                || string.IsNullOrWhiteSpace(settings.PublicBaseUrl))
            {
                throw new InvalidOperationException(
                    "Storage:Provider is S3 but Storage:S3 Bucket, AccessKey, SecretKey or PublicBaseUrl is missing.");
            }

            _settings = settings;
            _publicBaseUrl = settings.PublicBaseUrl.TrimEnd('/');

            var config = new AmazonS3Config
            {
                ForcePathStyle = settings.ForcePathStyle,
                // R2 and several other S3-compatible services reject the SDK's default checksums
                RequestChecksumCalculation = RequestChecksumCalculation.WHEN_REQUIRED,
                ResponseChecksumValidation = ResponseChecksumValidation.WHEN_REQUIRED,
            };
            if (!string.IsNullOrWhiteSpace(settings.ServiceUrl))
            {
                config.ServiceURL = settings.ServiceUrl;
                config.AuthenticationRegion = settings.Region;
            }
            else
            {
                config.RegionEndpoint = Amazon.RegionEndpoint.GetBySystemName(settings.Region);
            }

            _client = new AmazonS3Client(new BasicAWSCredentials(settings.AccessKey, settings.SecretKey), config);
        }

        public async Task SaveAsync(string key, Stream content, string contentType, CancellationToken cancellationToken = default)
        {
            await _client.PutObjectAsync(new PutObjectRequest
            {
                BucketName = _settings.Bucket,
                Key = key,
                InputStream = content,
                ContentType = contentType,
                // Keys are unique per upload, so the content never changes
                Headers = { CacheControl = "public, max-age=31536000, immutable" },
            }, cancellationToken);
        }

        public async Task DeleteAsync(string key, CancellationToken cancellationToken = default)
        {
            await _client.DeleteObjectAsync(_settings.Bucket, key, cancellationToken);
        }

        public string GetPublicUrl(string key) => $"{_publicBaseUrl}/{key}";

        public void Dispose() => _client.Dispose();
    }
}
