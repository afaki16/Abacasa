using System;

namespace Abacasa.API.Filters
{
    /// <summary>
    /// Marks an endpoint as reachable while the user's MustChangePassword flag is set.
    /// Every other authenticated endpoint is blocked by <see cref="Middleware.PasswordChangeRequiredMiddleware"/>
    /// until the password is changed. [AllowAnonymous] endpoints are always reachable.
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
    public sealed class AllowWhenPasswordChangeRequiredAttribute : Attribute
    {
    }
}
