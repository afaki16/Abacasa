namespace Abacasa.Domain.Constants
{
    /// <summary>
    /// System role names with special logic in the application.
    /// Add only roles that have hardcoded behavior (e.g. SuperAdmin tenant bypass).
    /// Custom roles created dynamically are stored in the database.
    /// </summary>
    public static class RoleNames
    {
        public const string SuperAdmin = "SuperAdmin";
        public const string Admin = "Admin";
        public const string User = "User";
        public const string Manager = "Manager";

        // Hane rolleri: TenantMembership.Role'e karşılık gelen ortak sistem rolleri (izin setleri HouseholdPermissions'ta)
        public const string HouseholdAdmin = "HouseholdAdmin";
        public const string HouseholdMember = "HouseholdMember";

        public static readonly string[] Reserved = { SuperAdmin, Admin, User, Manager, HouseholdAdmin, HouseholdMember };
    }
}
