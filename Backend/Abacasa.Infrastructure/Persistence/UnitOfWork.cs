using Microsoft.EntityFrameworkCore.Storage;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Abacasa.Infrastructure.Persistence;
public class UnitOfWork : IUnitOfWork, IAsyncDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly IServiceProvider _serviceProvider;
    private IDbContextTransaction? _currentTransaction;
    private bool _disposed;

    // Repository fields with thread-safe lazy initialization
    private readonly Lazy<IUserRepository> _users;
    private readonly Lazy<IRoleRepository> _roles;
    private readonly Lazy<IPermissionRepository> _permissions;
    private readonly Lazy<IRefreshTokenRepository> _refreshTokens;
    private readonly Lazy<IPasswordResetTokenRepository> _passwordResetTokens;
    private readonly Lazy<IUserVerificationTokenRepository> _userVerificationTokens;
    private readonly Lazy<ITenantRepository> _tenants;
    private readonly Lazy<ILoginAttemptRepository> _loginAttempts;
    private readonly Lazy<ICategoryRepository> _categories;
    private readonly Lazy<IPersonRepository> _people;
    private readonly Lazy<IPaymentMethodRepository> _paymentMethods;
    private readonly Lazy<IExpenseRepository> _expenses;
    private readonly Lazy<IDonationRepository> _donations;
    private readonly Lazy<IRecurringPaymentRepository> _recurringPayments;
    private readonly Lazy<IDebtRepository> _debts;
    private readonly Lazy<IDebtPaymentRepository> _debtPayments;
    private readonly Lazy<IExchangeRateRepository> _exchangeRates;
    private readonly Lazy<ILedgerItemRepository> _ledgerItems;
    private readonly Lazy<IMonthlyAmountRepository> _monthlyAmounts;
    private readonly Lazy<IDonationTargetRepository> _donationTargets;
    private readonly Lazy<IDonationFundRepository> _donationFunds;
    private readonly Lazy<IFundMovementRepository> _fundMovements;
    private readonly Lazy<IVehicleRepository> _vehicles;
    private readonly Lazy<IVehicleObligationRepository> _vehicleObligations;

    public UnitOfWork(ApplicationDbContext context, IServiceProvider serviceProvider)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
        
        // Lazy repository'leri initialize et
        _users = new Lazy<IUserRepository>(() => _serviceProvider.GetRequiredService<IUserRepository>());
        _roles = new Lazy<IRoleRepository>(() => _serviceProvider.GetRequiredService<IRoleRepository>());
        _permissions = new Lazy<IPermissionRepository>(() => _serviceProvider.GetRequiredService<IPermissionRepository>());
        _refreshTokens = new Lazy<IRefreshTokenRepository>(() => _serviceProvider.GetRequiredService<IRefreshTokenRepository>());
        _passwordResetTokens = new Lazy<IPasswordResetTokenRepository>(() => _serviceProvider.GetRequiredService<IPasswordResetTokenRepository>());
        _userVerificationTokens = new Lazy<IUserVerificationTokenRepository>(() => _serviceProvider.GetRequiredService<IUserVerificationTokenRepository>());
        _tenants = new Lazy<ITenantRepository>(() => _serviceProvider.GetRequiredService<ITenantRepository>());
        _loginAttempts = new Lazy<ILoginAttemptRepository>(() => _serviceProvider.GetRequiredService<ILoginAttemptRepository>());
        _categories = new Lazy<ICategoryRepository>(() => _serviceProvider.GetRequiredService<ICategoryRepository>());
        _people = new Lazy<IPersonRepository>(() => _serviceProvider.GetRequiredService<IPersonRepository>());
        _paymentMethods = new Lazy<IPaymentMethodRepository>(() => _serviceProvider.GetRequiredService<IPaymentMethodRepository>());
        _expenses = new Lazy<IExpenseRepository>(() => _serviceProvider.GetRequiredService<IExpenseRepository>());
        _donations = new Lazy<IDonationRepository>(() => _serviceProvider.GetRequiredService<IDonationRepository>());
        _recurringPayments = new Lazy<IRecurringPaymentRepository>(() => _serviceProvider.GetRequiredService<IRecurringPaymentRepository>());
        _debts = new Lazy<IDebtRepository>(() => _serviceProvider.GetRequiredService<IDebtRepository>());
        _debtPayments = new Lazy<IDebtPaymentRepository>(() => _serviceProvider.GetRequiredService<IDebtPaymentRepository>());
        _exchangeRates = new Lazy<IExchangeRateRepository>(() => _serviceProvider.GetRequiredService<IExchangeRateRepository>());
        _ledgerItems = new Lazy<ILedgerItemRepository>(() => _serviceProvider.GetRequiredService<ILedgerItemRepository>());
        _monthlyAmounts = new Lazy<IMonthlyAmountRepository>(() => _serviceProvider.GetRequiredService<IMonthlyAmountRepository>());
        _donationTargets = new Lazy<IDonationTargetRepository>(() => _serviceProvider.GetRequiredService<IDonationTargetRepository>());
        _donationFunds = new Lazy<IDonationFundRepository>(() => _serviceProvider.GetRequiredService<IDonationFundRepository>());
        _fundMovements = new Lazy<IFundMovementRepository>(() => _serviceProvider.GetRequiredService<IFundMovementRepository>());
        _vehicles = new Lazy<IVehicleRepository>(() => _serviceProvider.GetRequiredService<IVehicleRepository>());
        _vehicleObligations = new Lazy<IVehicleObligationRepository>(() => _serviceProvider.GetRequiredService<IVehicleObligationRepository>());

    }

    // Repository properties - only created when accessed
    public IUserRepository Users => _users.Value;
    public IRoleRepository Roles => _roles.Value;
    public IPermissionRepository Permissions => _permissions.Value;
    public IRefreshTokenRepository RefreshTokens => _refreshTokens.Value;
    public IPasswordResetTokenRepository PasswordResetTokens => _passwordResetTokens.Value;
    public IUserVerificationTokenRepository UserVerificationTokens => _userVerificationTokens.Value;
    public ITenantRepository Tenants => _tenants.Value;
    public ILoginAttemptRepository LoginAttempts => _loginAttempts.Value;
    public ICategoryRepository Categories => _categories.Value;
    public IPersonRepository People => _people.Value;
    public IPaymentMethodRepository PaymentMethods => _paymentMethods.Value;
    public IExpenseRepository Expenses => _expenses.Value;
    public IDonationRepository Donations => _donations.Value;
    public IRecurringPaymentRepository RecurringPayments => _recurringPayments.Value;
    public IDebtRepository Debts => _debts.Value;
    public IDebtPaymentRepository DebtPayments => _debtPayments.Value;
    public IExchangeRateRepository ExchangeRates => _exchangeRates.Value;
    public ILedgerItemRepository LedgerItems => _ledgerItems.Value;
    public IMonthlyAmountRepository MonthlyAmounts => _monthlyAmounts.Value;
    public IDonationTargetRepository DonationTargets => _donationTargets.Value;
    public IDonationFundRepository DonationFunds => _donationFunds.Value;
    public IFundMovementRepository FundMovements => _fundMovements.Value;
    public IVehicleRepository Vehicles => _vehicles.Value;
    public IVehicleObligationRepository VehicleObligations => _vehicleObligations.Value;




    /// <summary>
    /// Save all changes made in this unit of work
    /// </summary>
    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Begin a new transaction
    /// </summary>
    public async Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_currentTransaction != null)
        {
            throw new InvalidOperationException("A transaction is already in progress.");
        }

        _currentTransaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        return _currentTransaction;
    }

    /// <summary>
    /// Commit the current transaction
    /// </summary>
    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            if (_currentTransaction == null)
            {
                throw new InvalidOperationException("No transaction is currently active.");
            }

            await SaveChangesAsync(cancellationToken);
            await _currentTransaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await RollbackTransactionAsync(cancellationToken);
            throw;
        }
        finally
        {
            if (_currentTransaction != null)
            {
                await _currentTransaction.DisposeAsync();
                _currentTransaction = null;
            }
        }
    }

    /// <summary>
    /// Rollback the current transaction
    /// </summary>
    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            if (_currentTransaction != null)
            {
                await _currentTransaction.RollbackAsync(cancellationToken);
            }
        }
        finally
        {
            if (_currentTransaction != null)
            {
                await _currentTransaction.DisposeAsync();
                _currentTransaction = null;
            }
        }
    }

    /// <summary>
    /// Execute a function within a transaction
    /// </summary>
    public async Task<T> ExecuteInTransactionAsync<T>(Func<Task<T>> operation, CancellationToken cancellationToken = default)
    {
        if (_currentTransaction != null)
        {
            throw new InvalidOperationException("A transaction is already in progress.");
        }

        try
        {
            await BeginTransactionAsync(cancellationToken);
            var result = await operation();
            await CommitTransactionAsync(cancellationToken);
            return result;
        }
        catch
        {
            await RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    /// <summary>
    /// Execute an action within a transaction
    /// </summary>
    public async Task ExecuteInTransactionAsync(Func<Task> operation, CancellationToken cancellationToken = default)
    {
        if (_currentTransaction != null)
        {
            throw new InvalidOperationException("A transaction is already in progress.");
        }

        try
        {
            await BeginTransactionAsync(cancellationToken);
            await operation();
            await CommitTransactionAsync(cancellationToken);
        }
        catch
        {
            await RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    /// <summary>
    /// Async disposal implementation
    /// </summary>
    public async ValueTask DisposeAsync()
    {
        await DisposeAsyncCore().ConfigureAwait(false);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Core async disposal logic
    /// </summary>
    protected virtual async ValueTask DisposeAsyncCore()
    {
        if (_disposed)
        {
            return;
        }

        if (_currentTransaction != null)
        {
            await _currentTransaction.DisposeAsync();
            _currentTransaction = null;
        }

        await _context.DisposeAsync();
        _disposed = true;
    }

    /// <summary>
    /// Synchronous disposal for IDisposable compatibility
    /// </summary>
    public void Dispose()
    {
        DisposeAsync().AsTask().Wait();
    }

    /// <summary>
    /// Finalizer to ensure resources are cleaned up
    /// </summary>
    ~UnitOfWork()
    {
        DisposeAsync().AsTask().Wait();
    }
}
