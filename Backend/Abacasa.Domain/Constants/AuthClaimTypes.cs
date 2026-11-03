namespace Abacasa.Domain.Constants
{
    /// <summary>
    /// Custom claim types added to the authenticated principal at request time.
    /// </summary>
    public static class AuthClaimTypes
    {
        /// <summary>
        /// Added in JwtBearer OnTokenValidated when the user's MustChangePassword flag is set.
        /// Read from the database on every request, so it is never stale.
        /// </summary>
        public const string MustChangePassword = "must_change_password";
    }
}
