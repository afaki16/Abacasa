using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Reflection;
using System.Linq.Expressions;

namespace Abacasa.Infrastructure.Persistence
{
    public class ApplicationDbContext : DbContext
    {
        private readonly ICurrentUserService _currentUserService;

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, ICurrentUserService currentUserService = null)
            : base(options)
        {
            _currentUserService = currentUserService;
        }

        private int? CurrentTenantId => _currentUserService?.TenantId;

        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Permission> Permissions { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<RolePermission> RolePermissions { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
        public DbSet<UserVerificationToken> UserVerificationTokens { get; set; }
        public DbSet<Tenant> Tenants { get; set; }
        public DbSet<LoginAttempt> LoginAttempts { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Person> People { get; set; }
        public DbSet<PaymentMethod> PaymentMethods { get; set; }
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<Donation> Donations { get; set; }
        public DbSet<RecurringPayment> RecurringPayments { get; set; }
        public DbSet<Debt> Debts { get; set; }
        public DbSet<DebtPayment> DebtPayments { get; set; }
        public DbSet<ExchangeRate> ExchangeRates { get; set; }
        public DbSet<LedgerItem> LedgerItems { get; set; }
        public DbSet<MonthlyAmount> MonthlyAmounts { get; set; }
        public DbSet<DonationTarget> DonationTargets { get; set; }
        public DbSet<DonationFund> DonationFunds { get; set; }
        public DbSet<FundMovement> FundMovements { get; set; }
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<VehicleObligation> VehicleObligations { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

            // Soft delete filter - Generic method kullanarak
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
                {
                    var filterMethodName = typeof(ITenantScoped).IsAssignableFrom(entityType.ClrType)
                        ? nameof(SetTenantFilter)
                        : nameof(SetSoftDeleteFilter);

                    var method = typeof(ApplicationDbContext)
                        .GetMethod(filterMethodName, BindingFlags.NonPublic | BindingFlags.Instance)
                        .MakeGenericMethod(entityType.ClrType);

                    method.Invoke(this, new object[] { modelBuilder });
                }
            }

            base.OnModelCreating(modelBuilder);
        }

        private void SetSoftDeleteFilter<T>(ModelBuilder modelBuilder) where T : BaseEntity
        {
            modelBuilder.Entity<T>().HasQueryFilter(e => !e.IsDeleted);
        }

        // Soft-delete ve tenant tek ifadede: isimsiz ikinci HasQueryFilter ilkini ezer.
        private void SetTenantFilter<T>(ModelBuilder modelBuilder) where T : BaseEntity, ITenantScoped
        {
            modelBuilder.Entity<T>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        }

        private void ApplyTenantRules()
        {
            foreach (var entry in ChangeTracker.Entries<ITenantScoped>())
            {
                if (entry.State == EntityState.Added)
                {
                    if (CurrentTenantId.HasValue)
                        entry.Entity.TenantId = CurrentTenantId.Value; // istek içinde: her zaman kullanıcının hanesi
                    else if (entry.Entity.TenantId == 0)
                        throw new InvalidOperationException("Hane verisi için TenantId belirlenemedi.");
                }
                else if (entry.State is EntityState.Modified or EntityState.Deleted)
                {
                    var tenantProp = entry.Property(nameof(ITenantScoped.TenantId));
                    if (!Equals(tenantProp.OriginalValue, tenantProp.CurrentValue))
                        throw new InvalidOperationException("Bir kaydın hanesi değiştirilemez.");
                    if (CurrentTenantId.HasValue && entry.Entity.TenantId != CurrentTenantId.Value)
                        throw new InvalidOperationException("Başka bir hanenin kaydı değiştirilemez.");
                }
            }
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            foreach (var entry in ChangeTracker.Entries<BaseAuditableEntity>())
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.CreatedBy = _currentUserService?.UserId;
                        entry.Entity.CreatedDate = DateTime.UtcNow;
                        break;

                    case EntityState.Modified:
                        entry.Entity.UpdatedBy = _currentUserService?.UserId;
                        entry.Entity.UpdatedDate = DateTime.UtcNow;
                        break;
                }
            }

            foreach (var entry in ChangeTracker.Entries<BaseEntity>())
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.CreatedDate = DateTime.UtcNow;
                        break;

                    case EntityState.Modified:
                        entry.Entity.UpdatedDate = DateTime.UtcNow;
                        break;
                }
            }

            ApplyTenantRules();

            return await base.SaveChangesAsync(cancellationToken);
        }
    }
} 
