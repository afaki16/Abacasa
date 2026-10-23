namespace Abacasa.Domain.Constants
{
    public static class Permissions
{
    // User permissions
    public static class Users
    {
        public const string Read = "Users.Read";
        public const string Create = "Users.Create";
        public const string Update = "Users.Update";
        public const string Delete = "Users.Delete";
    }

    // Role permissions
    public static class Roles
    {
        public const string Read = "Roles.Read";
        public const string Create = "Roles.Create";
        public const string Update = "Roles.Update";
        public const string Delete = "Roles.Delete";
    }

    // Permission permissions
    public static class Permission
    {
        public const string Read = "Permissions.Read";
        public const string Create = "Permissions.Create";
        public const string Update = "Permissions.Update";
        public const string Delete = "Permissions.Delete";
    }

    // Tenant permissions
    public static class Tenants
    {
        public const string Read = "Tenants.Read";
        public const string Create = "Tenants.Create";
        public const string Update = "Tenants.Update";
        public const string Delete = "Tenants.Delete";
    }

    // Category permissions
    public static class Categories
    {
        public const string Read = "Categories.Read";
        public const string Create = "Categories.Create";
        public const string Update = "Categories.Update";
        public const string Delete = "Categories.Delete";
    }

    // Person permissions
    public static class People
    {
        public const string Read = "People.Read";
        public const string Create = "People.Create";
        public const string Update = "People.Update";
        public const string Delete = "People.Delete";
    }

    // Payment method permissions
    public static class PaymentMethods
    {
        public const string Read = "PaymentMethods.Read";
        public const string Create = "PaymentMethods.Create";
        public const string Update = "PaymentMethods.Update";
        public const string Delete = "PaymentMethods.Delete";
    }

    // Expense permissions
    public static class Expenses
    {
        public const string Read = "Expenses.Read";
        public const string Create = "Expenses.Create";
        public const string Update = "Expenses.Update";
        public const string Delete = "Expenses.Delete";
    }

    // Donation permissions
    public static class Donations
    {
        public const string Read = "Donations.Read";
        public const string Create = "Donations.Create";
        public const string Update = "Donations.Update";
        public const string Delete = "Donations.Delete";
    }

    // Donation target permissions
    public static class DonationTargets
    {
        public const string Read = "DonationTargets.Read";
        public const string Create = "DonationTargets.Create";
        public const string Update = "DonationTargets.Update";
        public const string Delete = "DonationTargets.Delete";
    }

    // Donation fund (emanet) permissions; hareket ekleme/düzenleme/silme DonationFunds.Update ister
    public static class DonationFunds
    {
        public const string Read = "DonationFunds.Read";
        public const string Create = "DonationFunds.Create";
        public const string Update = "DonationFunds.Update";
        public const string Delete = "DonationFunds.Delete";
    }

    // Recurring payment permissions
    public static class RecurringPayments
    {
        public const string Read = "RecurringPayments.Read";
        public const string Create = "RecurringPayments.Create";
        public const string Update = "RecurringPayments.Update";
        public const string Delete = "RecurringPayments.Delete";
    }

    // Dashboard (Özet) permissions
    public static class Dashboard
    {
        public const string Read = "Dashboard.Read";
    }

    // Debt permissions (ödeme ekleme/düzenleme/silme Debts.Update ister)
    public static class Debts
    {
        public const string Read = "Debts.Read";
        public const string Create = "Debts.Create";
        public const string Update = "Debts.Update";
        public const string Delete = "Debts.Delete";
    }

    // Ledger (yıllık tablo) permissions: rapor Read, hücre yazma Update ister
    public static class Ledger
    {
        public const string Read = "Ledger.Read";
        public const string Create = "Ledger.Create";
        public const string Update = "Ledger.Update";
        public const string Delete = "Ledger.Delete";
    }

    // Vehicle permissions; işlem ekleme/düzenleme/silme Vehicles.Update ister
    public static class Vehicles
    {
        public const string Read = "Vehicles.Read";
        public const string Create = "Vehicles.Create";
        public const string Update = "Vehicles.Update";
        public const string Delete = "Vehicles.Delete";
    }

    // Exchange rate permissions
    public static class ExchangeRates
    {
        public const string Read = "ExchangeRates.Read";
        public const string Create = "ExchangeRates.Create";
        public const string Update = "ExchangeRates.Update";
        public const string Delete = "ExchangeRates.Delete";
    }

    // Helper methods
    public static class Helper
    {
        public static string[] GetAllPermissions()
        {
            return typeof(Permissions)
                .GetNestedTypes()
                .SelectMany(t => t.GetFields())
                .Where(f => f.IsStatic && f.IsLiteral && !f.IsInitOnly)
                .Select(f => f.GetValue(null)?.ToString())
                .Where(p => !string.IsNullOrEmpty(p))
                .ToArray()!;
        }

        public static string[] GetPermissionsByResource(string resource)
        {
            var resourceType = typeof(Permissions).GetNestedType(resource);
            if (resourceType == null)
                return Array.Empty<string>();

            return resourceType.GetFields()
                .Where(f => f.IsStatic && f.IsLiteral && !f.IsInitOnly)
                .Select(f => f.GetValue(null)?.ToString())
                .Where(p => !string.IsNullOrEmpty(p))
                .ToArray()!;
        }

        public static string[] GetResources()
        {
            return typeof(Permissions)
                .GetNestedTypes()
                .Where(t => t.IsClass && t.IsNestedPublic)
                .Select(t => t.Name)
                .ToArray();
        }
    }
}
} 
