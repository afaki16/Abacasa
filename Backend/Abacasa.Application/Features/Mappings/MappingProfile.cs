using AutoMapper;
using Abacasa.Application.Features.Users.Dtos;
using Abacasa.Application.Features.Roles.Dtos;
using Abacasa.Application.Features.Tenants.Dtos;
using Abacasa.Application.Features.Categories.Dtos;
using Abacasa.Application.Features.People.Dtos;
using Abacasa.Application.Features.PaymentMethods.Dtos;
using Abacasa.Application.Features.Expenses.Dtos;
using Abacasa.Application.Features.Donations.Dtos;
using Abacasa.Application.Features.RecurringPayments.Dtos;
using Abacasa.Application.Features.Debts.Common;
using Abacasa.Application.Features.Debts.Dtos;
using Abacasa.Application.Features.ExchangeRates.Dtos;
using Abacasa.Application.Features.Ledger.Dtos;
using Abacasa.Application.Features.DonationTargets.Dtos;
using Abacasa.Application.Features.DonationFunds.Dtos;
using Abacasa.Application.Features.Vehicles.Dtos;
using Abacasa.Application.Features.Permissions.Dtos;
using Abacasa.Application.Features.Auth.Dtos;
using Abacasa.Application.Features.Auth.Commands.Login;
using Abacasa.Application.Features.Auth.Commands.Logout;
using Abacasa.Application.Features.Auth.Commands.LogoutAll;
using Abacasa.Application.Features.Auth.Commands.LogoutDevice;
using Abacasa.Application.Features.Auth.Commands.Register;
using Abacasa.Application.Features.Auth.Commands.RefreshToken;
using Abacasa.Application.Features.Auth.Commands.ChangePassword;
using Abacasa.Application.Features.Auth.Commands.ForgotPassword;
using Abacasa.Application.Features.Auth.Commands.ResetPassword;
using Abacasa.Application.Features.Roles.Commands.CreateRole;
using Abacasa.Application.Features.Roles.Commands.UpdateRole;
using Abacasa.Application.Features.Roles.Commands.DeleteRole;
using Abacasa.Application.Features.Users.Commands.CreateUser;
using Abacasa.Application.Features.Users.Commands.UpdateUser;
using Abacasa.Application.Features.Users.Commands.DeleteUser;
using Abacasa.Application.Features.Tenants.Commands.CreateTenant;
using Abacasa.Application.Features.Tenants.Commands.UpdateTenant;
using Abacasa.Application.Features.Tenants.Commands.DeleteTenant;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Common.Enums;
namespace Abacasa.Application.Features.Mappings;

    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // User mappings
            CreateMap<User, UserDto>()
                .ForMember(dest => dest.Roles, opt => opt.MapFrom(src => src.UserRoles.Select(ur => ur.Role)))
                .ForMember(dest => dest.Permissions, opt => opt.MapFrom(src =>
                    src.UserRoles.SelectMany(ur => ur.Role.RolePermissions.Select(rp => rp.Permission)).Distinct()))
                // Aktif hane ve üyelikler yalnızca login/refresh/me yanıtında (UserProfileBuilder) doldurulur
                .ForMember(dest => dest.ActiveTenant, opt => opt.Ignore())
                .ForMember(dest => dest.Memberships, opt => opt.Ignore());

            // User list mapping (without permissions for performance)
            CreateMap<User, UserListDto>()
                .ForMember(dest => dest.Roles, opt => opt.MapFrom(src => src.UserRoles.Select(ur => ur.Role)));

            CreateMap<CreateUserCommand, User>()
                .ForMember(dest => dest.UserRoles, opt => opt.Ignore());

            CreateMap<CreateUserDto, User>()
                .ForMember(dest => dest.UserRoles, opt => opt.Ignore());

            CreateMap<UpdateUserCommand, User>()
                .ForMember(dest => dest.UserRoles, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore());

            CreateMap<UpdateUserDto, User>()
                .ForMember(dest => dest.UserRoles, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore());

            CreateMap<RegisterCommand, User>()
                .ForMember(dest => dest.UserRoles, opt => opt.Ignore())
                .ForMember(dest => dest.PasswordHash, opt => opt.MapFrom(src => src.Password)); // This will be hashed in handler

            CreateMap<RegisterRequestDto, RegisterCommand>();
            CreateMap<LoginRequestDto, LoginCommand>();
            CreateMap<RefreshTokenRequestDto, RefreshTokenCommand>();

            // Role mappings
            CreateMap<Role, RoleDto>()
                .ForMember(dest => dest.Permissions, opt => opt.MapFrom(src => 
                    src.RolePermissions.Select(rp => rp.Permission).Where(p => p != null).ToList()));

            CreateMap<CreateRoleCommand, Role>()
                .ForMember(dest => dest.RolePermissions, opt => opt.Ignore());

            CreateMap<CreateRoleDto, Role>()
                .ForMember(dest => dest.RolePermissions, opt => opt.Ignore());

            CreateMap<UpdateRoleCommand, Role>()
                .ForMember(dest => dest.RolePermissions, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore());

            CreateMap<UpdateRoleDto, Role>()
                .ForMember(dest => dest.RolePermissions, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore());

            // Permission mappings
            CreateMap<Permission, PermissionDto>()
                .ForMember(dest => dest.IndividualPermissions, opt => opt.MapFrom(src => 
                    src.Type.GetIndividualPermissions().Select(p => p.ToString()).ToList()));

           

            // UserRole mappings
            CreateMap<UserRole, UserDto>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.User.Id))
                .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.User.FirstName))
                .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.User.LastName))
                .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.User.FullName))
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.User.Email))
                .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.User.PhoneNumber))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.User.Status))
                .ForMember(dest => dest.LastLoginDate, opt => opt.MapFrom(src => src.User.LastLoginDate))
                .ForMember(dest => dest.EmailConfirmed, opt => opt.MapFrom(src => src.User.EmailConfirmed))
                .ForMember(dest => dest.PhoneConfirmed, opt => opt.MapFrom(src => src.User.PhoneConfirmed))
                .ForMember(dest => dest.ProfileImageUrl, opt => opt.MapFrom(src => src.User.ProfileImageUrl))
                .ForMember(dest => dest.CreatedDate, opt => opt.MapFrom(src => src.User.CreatedDate))
                .ForMember(dest => dest.Roles, opt => opt.Ignore())
                .ForMember(dest => dest.Permissions, opt => opt.Ignore());

            // RolePermission mappings
            CreateMap<RolePermission, RoleDto>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Role.Id))
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Role.Name))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Role.Description))
                .ForMember(dest => dest.IsSystemRole, opt => opt.MapFrom(src => src.Role.IsSystemRole))
                .ForMember(dest => dest.CreatedDate, opt => opt.MapFrom(src => src.Role.CreatedDate))
                .ForMember(dest => dest.Permissions, opt => opt.Ignore());

            // RefreshToken mappings (plaintext secret is never on the entity; use JwtService / PlainToken)
            CreateMap<RefreshToken, LoginResponseDto>()
                .ForMember(dest => dest.RefreshToken, opt => opt.Ignore())
                .ForMember(dest => dest.ExpiresAt, opt => opt.MapFrom(src => src.ExpiryDate))
                .ForMember(dest => dest.AccessToken, opt => opt.Ignore())
                .ForMember(dest => dest.User, opt => opt.Ignore());

        // Tenant mappings
        CreateMap<Tenant, TenantDto>()
            .ForMember(dest => dest.UserCount, opt => opt.Ignore());

        CreateMap<Tenant, TenantListDto>()
            .ForMember(dest => dest.UserCount, opt => opt.Ignore());

        // DTO -> Command mappings (Controller'da kullan�l�r)
        CreateMap<CreateTenantDto, CreateTenantCommand>();
        CreateMap<UpdateTenantDto, UpdateTenantCommand>();

        // Category mappings
        CreateMap<Category, CategoryListDto>();
        CreateMap<Category, CategoryDto>();

        // Person mappings
        CreateMap<Person, PersonListDto>();
        CreateMap<Person, PersonDto>();

        // PaymentMethod mappings
        CreateMap<PaymentMethod, PaymentMethodListDto>()
            .ForMember(dest => dest.OwnerPersonName,
                opt => opt.MapFrom(src => src.OwnerPerson != null ? src.OwnerPerson.Name : null));
        CreateMap<PaymentMethod, PaymentMethodDto>()
            .ForMember(dest => dest.OwnerPersonName,
                opt => opt.MapFrom(src => src.OwnerPerson != null ? src.OwnerPerson.Name : null));

        // Expense mappings
        CreateMap<Expense, ExpenseListDto>()
            .ForMember(dest => dest.CategoryName,
                opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : null))
            .ForMember(dest => dest.PaymentMethodName,
                opt => opt.MapFrom(src => src.PaymentMethod != null ? src.PaymentMethod.Name : null))
            .ForMember(dest => dest.PaymentMethodType,
                opt => opt.MapFrom(src => src.PaymentMethod.Type))
            .ForMember(dest => dest.OwnerPersonName,
                opt => opt.MapFrom(src => src.OwnerPerson != null ? src.OwnerPerson.Name : null));
        CreateMap<Expense, ExpenseDto>()
            .ForMember(dest => dest.CategoryName,
                opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : null))
            .ForMember(dest => dest.PaymentMethodName,
                opt => opt.MapFrom(src => src.PaymentMethod != null ? src.PaymentMethod.Name : null))
            .ForMember(dest => dest.PaymentMethodType,
                opt => opt.MapFrom(src => src.PaymentMethod.Type))
            .ForMember(dest => dest.OwnerPersonName,
                opt => opt.MapFrom(src => src.OwnerPerson != null ? src.OwnerPerson.Name : null));

        // Donation mappings
        CreateMap<Donation, DonationListDto>()
            .ForMember(dest => dest.PaymentMethodName,
                opt => opt.MapFrom(src => src.PaymentMethod != null ? src.PaymentMethod.Name : null))
            .ForMember(dest => dest.PaymentMethodType,
                opt => opt.MapFrom(src => src.PaymentMethod.Type))
            .ForMember(dest => dest.GiverPersonName,
                opt => opt.MapFrom(src => src.GiverPerson != null ? src.GiverPerson.Name : null))
            .ForMember(dest => dest.FundLabel, opt => opt.Ignore());
        CreateMap<Donation, DonationDto>()
            .ForMember(dest => dest.PaymentMethodName,
                opt => opt.MapFrom(src => src.PaymentMethod != null ? src.PaymentMethod.Name : null))
            .ForMember(dest => dest.PaymentMethodType,
                opt => opt.MapFrom(src => src.PaymentMethod.Type))
            .ForMember(dest => dest.GiverPersonName,
                opt => opt.MapFrom(src => src.GiverPerson != null ? src.GiverPerson.Name : null))
            .ForMember(dest => dest.FundLabel, opt => opt.Ignore());

        // RecurringPayment mappings (HasPayments handler'da doldurulur)
        CreateMap<RecurringPayment, RecurringPaymentListDto>()
            .ForMember(dest => dest.PaymentMethodName,
                opt => opt.MapFrom(src => src.PaymentMethod != null ? src.PaymentMethod.Name : null))
            .ForMember(dest => dest.CategoryName,
                opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : null))
            .ForMember(dest => dest.OwnerPersonName,
                opt => opt.MapFrom(src => src.OwnerPerson != null ? src.OwnerPerson.Name : null))
            .ForMember(dest => dest.HasPayments, opt => opt.Ignore());
        CreateMap<RecurringPayment, RecurringPaymentDto>()
            .ForMember(dest => dest.PaymentMethodName,
                opt => opt.MapFrom(src => src.PaymentMethod != null ? src.PaymentMethod.Name : null))
            .ForMember(dest => dest.CategoryName,
                opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : null))
            .ForMember(dest => dest.OwnerPersonName,
                opt => opt.MapFrom(src => src.OwnerPerson != null ? src.OwnerPerson.Name : null))
            .ForMember(dest => dest.HasPayments, opt => opt.Ignore());

        // Debt mappings (ödenen/kalan alanları DebtAmounts.Fill ile handler'da doldurulur)
        CreateMap<Debt, DebtListDto>()
            .ForMember(dest => dest.CreditorName,
                opt => opt.MapFrom(src => src.CreditorPerson != null ? src.CreditorPerson.Name : null))
            .ForMember(dest => dest.DebtorName,
                opt => opt.MapFrom(src => src.DebtorPerson != null ? src.DebtorPerson.Name : null))
            .ForMember(dest => dest.PaidAmount, opt => opt.Ignore())
            .ForMember(dest => dest.Remaining, opt => opt.Ignore())
            .ForMember(dest => dest.IsClosed, opt => opt.Ignore())
            .ForMember(dest => dest.PaidInTry, opt => opt.Ignore())
            .ForMember(dest => dest.RemainingInTry, opt => opt.Ignore())
            .ForMember(dest => dest.PaymentCount, opt => opt.Ignore())
            .ForMember(dest => dest.HasPayments, opt => opt.Ignore());
        CreateMap<Debt, DebtDto>()
            .IncludeBase<Debt, DebtListDto>();
        CreateMap<DebtPayment, DebtPaymentDto>()
            .ForMember(dest => dest.AmountInTry,
                opt => opt.MapFrom(src => DebtAmounts.PaymentInTry(src)));

        // ExchangeRate mappings
        CreateMap<ExchangeRate, ExchangeRateDto>();

        // LedgerItem mappings (HasAmounts handler'da doldurulur)
        CreateMap<LedgerItem, LedgerItemListDto>()
            .ForMember(dest => dest.OwnerName,
                opt => opt.MapFrom(src => src.OwnerPerson != null ? src.OwnerPerson.Name : null))
            .ForMember(dest => dest.HasAmounts, opt => opt.Ignore());
        CreateMap<LedgerItem, LedgerItemDto>()
            .IncludeBase<LedgerItem, LedgerItemListDto>();

        // DonationTarget mappings
        CreateMap<DonationTarget, DonationTargetDto>()
            .ForMember(dest => dest.OwnerName,
                opt => opt.MapFrom(src => src.OwnerPerson != null ? src.OwnerPerson.Name : null));

        // DonationFund mappings (dağıtılan/kullanımda/kalan/elde FundBalance.Fill ile handler'da doldurulur)
        CreateMap<DonationFund, DonationFundDto>()
            .ForMember(dest => dest.FromPersonName,
                opt => opt.MapFrom(src => src.FromPerson != null ? src.FromPerson.Name : null))
            .ForMember(dest => dest.Distributed, opt => opt.Ignore())
            .ForMember(dest => dest.InUse, opt => opt.Ignore())
            .ForMember(dest => dest.Remaining, opt => opt.Ignore())
            .ForMember(dest => dest.OnHand, opt => opt.Ignore())
            .ForMember(dest => dest.IsClosed, opt => opt.Ignore())
            .ForMember(dest => dest.DistributionCount, opt => opt.Ignore())
            .ForMember(dest => dest.MovementCount, opt => opt.Ignore());
        CreateMap<FundMovement, FundMovementDto>();

        // Vehicle mappings (Current ve HasExpense handler'da doldurulur)
        CreateMap<Vehicle, VehicleDto>()
            .ForMember(dest => dest.OwnerName,
                opt => opt.MapFrom(src => src.OwnerPerson != null ? src.OwnerPerson.Name : null))
            .ForMember(dest => dest.Current, opt => opt.Ignore());
        CreateMap<VehicleObligation, VehicleObligationDto>()
            .ForMember(dest => dest.HasExpense, opt => opt.Ignore());
    }
    }

