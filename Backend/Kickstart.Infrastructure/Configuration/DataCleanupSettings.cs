namespace Kickstart.Infrastructure.Configuration
{
    public class DataCleanupSettings
    {
        public bool Enabled { get; set; } = true;
        public int IntervalHours { get; set; } = 24;
        public int InitialDelayMinutes { get; set; } = 1;
        public int RefreshTokenRetentionDays { get; set; } = 30;
        public int PasswordResetTokenRetentionDays { get; set; } = 7;
        public int VerificationTokenRetentionDays { get; set; } = 7;
        public int LoginAttemptRetentionDays { get; set; } = 30;
    }
}
