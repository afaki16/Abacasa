namespace Abacasa.Infrastructure.Configuration
{
    // appsettings "DataRetention" bölümü (imha işi)
    public class DataRetentionSettings
    {
        // Soft-deleted hane verisi, kullanıcı ve hane bu kadar gün sonra imha edilir / anonimleşir
        public int SoftDeletePurgeDays { get; set; } = 30;
        // Süresi dolmuş ya da iptal/kullanılmış token'lar ve sonuçlanmış davetler
        public int ExpiredTokenPurgeDays { get; set; } = 30;
        public int LoginAttemptPurgeDays { get; set; } = 90;
        public int StartupDelayMinutes { get; set; } = 5;
        public int IntervalHours { get; set; } = 24;
    }
}
