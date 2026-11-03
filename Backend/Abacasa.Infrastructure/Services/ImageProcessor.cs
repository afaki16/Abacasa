using Abacasa.Application.Interfaces;
using SkiaSharp;

namespace Abacasa.Infrastructure.Services
{
    public class ImageProcessor : IImageProcessor
    {
        // Decompression-bomb guard: a small file can declare a huge canvas
        private const long MaxSourcePixels = 40_000_000;
        private const int WebpQuality = 82;

        private static readonly SKEncodedImageFormat[] AllowedFormats =
            [SKEncodedImageFormat.Jpeg, SKEncodedImageFormat.Png, SKEncodedImageFormat.Webp];

        public ProcessedImage? CreateAvatar(Stream input, int size = 512)
        {
            // SKCodec needs a seekable stream; uploads are small (size-limited by the API)
            using var buffer = new MemoryStream();
            input.CopyTo(buffer);
            buffer.Position = 0;

            using var codec = SKCodec.Create(buffer);
            if (codec is null || !AllowedFormats.Contains(codec.EncodedFormat))
                return null;

            var info = codec.Info;
            if (info.Width <= 0 || info.Height <= 0 || (long)info.Width * info.Height > MaxSourcePixels)
                return null;

            // Decode straight at a reduced size when the format supports it (JPEG/WEBP): a 12 MP
            // phone photo then needs a few MB of memory instead of ~50 MB
            // (the codec rounds to its supported steps, so step up until the short side still
            // covers the target; formats without scaling return the full size)
            var targetSide = Math.Min(size, Math.Min(info.Width, info.Height));
            var decodeSize = info.Size;
            for (var eighths = 1; eighths <= 8; eighths++)
            {
                var candidate = codec.GetScaledDimensions(eighths / 8f);
                if (Math.Min(candidate.Width, candidate.Height) >= targetSide)
                {
                    decodeSize = candidate;
                    break;
                }
            }
            using var bitmap = new SKBitmap(new SKImageInfo(decodeSize.Width, decodeSize.Height, SKColorType.Rgba8888, SKAlphaType.Premul));
            var decodeResult = codec.GetPixels(bitmap.Info, bitmap.GetPixels());
            if (decodeResult is not (SKCodecResult.Success or SKCodecResult.IncompleteInput))
                return null;

            var origin = codec.EncodedOrigin;
            var swapsAxes = origin is SKEncodedOrigin.LeftTop or SKEncodedOrigin.RightTop
                or SKEncodedOrigin.RightBottom or SKEncodedOrigin.LeftBottom;
            var orientedWidth = swapsAxes ? bitmap.Height : bitmap.Width;
            var orientedHeight = swapsAxes ? bitmap.Width : bitmap.Height;

            // Centre square of the (correctly oriented) photo, never upscaled
            var side = Math.Min(orientedWidth, orientedHeight);
            var target = Math.Min(size, side);
            var offsetX = (orientedWidth - side) / 2f;
            var offsetY = (orientedHeight - side) / 2f;

            using var surface = SKSurface.Create(new SKImageInfo(target, target, SKColorType.Rgba8888, SKAlphaType.Premul));
            var canvas = surface.Canvas;
            canvas.Clear(SKColors.Transparent);
            canvas.Scale((float)target / side);
            canvas.Translate(-offsetX, -offsetY);
            var orientation = OrientationMatrix(origin, bitmap.Width, bitmap.Height);
            canvas.Concat(in orientation);

            using var image = SKImage.FromBitmap(bitmap);
            canvas.DrawImage(image, 0, 0, new SKSamplingOptions(SKFilterMode.Linear, SKMipmapMode.Linear));
            canvas.Flush();

            using var snapshot = surface.Snapshot();
            using var encoded = snapshot.Encode(SKEncodedImageFormat.Webp, WebpQuality);
            if (encoded is null)
                return null;

            return new ProcessedImage(encoded.ToArray(), "image/webp", "webp");
        }

        /// <summary>Maps stored pixel coordinates (w × h) to display coordinates for an EXIF orientation.</summary>
        private static SKMatrix OrientationMatrix(SKEncodedOrigin origin, int w, int h) => origin switch
        {
            SKEncodedOrigin.TopRight    => new SKMatrix(-1, 0, w, 0, 1, 0, 0, 0, 1),   // mirror horizontally
            SKEncodedOrigin.BottomRight => new SKMatrix(-1, 0, w, 0, -1, h, 0, 0, 1),  // rotate 180°
            SKEncodedOrigin.BottomLeft  => new SKMatrix(1, 0, 0, 0, -1, h, 0, 0, 1),   // mirror vertically
            SKEncodedOrigin.LeftTop     => new SKMatrix(0, 1, 0, 1, 0, 0, 0, 0, 1),    // transpose
            SKEncodedOrigin.RightTop    => new SKMatrix(0, -1, h, 1, 0, 0, 0, 0, 1),   // rotate 90° clockwise
            SKEncodedOrigin.RightBottom => new SKMatrix(0, -1, h, -1, 0, w, 0, 0, 1),  // transverse
            SKEncodedOrigin.LeftBottom  => new SKMatrix(0, 1, 0, -1, 0, w, 0, 0, 1),   // rotate 90° counter-clockwise
            _ => SKMatrix.Identity,
        };
    }
}
