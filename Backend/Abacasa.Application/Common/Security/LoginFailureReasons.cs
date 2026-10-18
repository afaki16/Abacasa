namespace Abacasa.Application.Common.Security
{
    public static class LoginFailureReasons
    {
        public const string InvalidPassword = "InvalidPassword";
        public const string UserNotFound = "UserNotFound";
        public const string AccountLocked = "AccountLocked";
        public const string AccountInactive = "AccountInactive";
        public const string TenantInactive = "TenantInactive";
        public const string EmailNotConfirmed = "EmailNotConfirmed";
        public const string MultipleTenants = "MultipleTenants";

        // Only real credential guesses count toward brute-force lockout. Other failures are
        // still recorded but must not extend or escalate a lockout.
        public static readonly string[] CountedForLockout = { InvalidPassword, UserNotFound };
    }
}
