using Abacasa.Domain.Common.Enums;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Abacasa.Domain.Constants
{
    /// <summary>
    /// Hane kaynakları ve hane rollerinin izin setleri; tek kaynak burasıdır.
    /// Hane kaynaklarının izinleri yalnızca aktif hanedeki üyelik rolünden gelir;
    /// sistem rolleri (UserRole, pratikte SuperAdmin) yalnızca hane kaynağı olmayan izinleri verir.
    /// Seed her açılışta HouseholdAdmin ve HouseholdMember rollerinin RolePermission kayıtlarını bu setlerle eşitler.
    /// </summary>
    public static class HouseholdPermissions
    {
        public static readonly IReadOnlySet<string> Resources = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Categories", "People", "PaymentMethods", "Expenses", "Donations", "DonationTargets", "DonationFunds",
            "RecurringPayments", "RecurringPaymentPayments", "Debts", "DebtPayments", "ExchangeRates", "Ledger",
            "Vehicles", "Dashboard", "Household", "HouseholdMembers"
        };

        /// "Resource.Action" izninin kaynağı hane kaynağı mı
        public static bool IsHouseholdPermission(string permission)
        {
            var dot = permission.IndexOf('.');
            return dot > 0 && Resources.Contains(permission[..dot]);
        }

        /// Hane kaynaklarının bütün izinleri (Permissions sabitlerinden)
        public static IReadOnlyList<string> All() =>
            Permissions.Helper.GetAllPermissions().Where(IsHouseholdPermission).ToList();

        /// HouseholdAdmin: hane kaynaklarının bütün izinleri
        public static IReadOnlyList<string> AdminPermissions() => All();

        /// HouseholdMember: hane kaynaklarının hepsinde Read; harcama ve bağışta yazma; vade ödeme ve borç ödemeleri
        public static IReadOnlyList<string> MemberPermissions()
        {
            var all = All();
            var member = all.Where(p => p.EndsWith(".Read", StringComparison.Ordinal)).ToList();
            member.AddRange(new[]
            {
                Permissions.Expenses.Create, Permissions.Expenses.Update, Permissions.Expenses.Delete,
                Permissions.Donations.Create, Permissions.Donations.Update, Permissions.Donations.Delete,
                Permissions.RecurringPaymentPayments.Create,
                Permissions.DebtPayments.Create, Permissions.DebtPayments.Update, Permissions.DebtPayments.Delete
            });
            return member.Distinct().ToList();
        }

        public static string RoleNameFor(HouseholdRole role) =>
            role == HouseholdRole.Admin ? RoleNames.HouseholdAdmin : RoleNames.HouseholdMember;

        public static IReadOnlyList<string> PermissionsFor(string householdRoleName) =>
            householdRoleName == RoleNames.HouseholdAdmin ? AdminPermissions() : MemberPermissions();
    }
}
