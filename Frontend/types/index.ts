import type { User } from './user'
import type { Role } from './role'
import type { Permission } from './permission'

// API Types
export type {
  ApiResponse,
  ValidationError,
  ApiError
} from './api'

// Auth Types
export type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  RefreshTokenRequest,
  Session
} from './auth'

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresAt: string
  user: User
}

// User Types
export type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  HouseholdRole,
  UserActiveTenant,
  UserMembership
} from './user'

export { UserStatus } from './user'

export interface UserWithRelations extends Omit<User, 'roles' | 'permissions'> {
  roles: Role[]
  permissions: Permission[]
}

// Role Types
export type {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest
} from './role'

// Tenant Types
export type {
  Tenant,
  CreateTenantRequest,
  UpdateTenantRequest
} from './tenant'

// Category Types
export type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest
} from './category'

// Person Types
export type {
  Person,
  CreatePersonRequest,
  UpdatePersonRequest
} from './person'

// Payment Method Types
export type {
  PaymentMethod,
  CreatePaymentMethodRequest,
  UpdatePaymentMethodRequest
} from './paymentMethod'

export { PaymentMethodType } from './paymentMethod'

// Expense Types
export type {
  Expense,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseFilters,
  ExpenseSummary
} from './expense'

// Donation Types
export type {
  Donation,
  CreateDonationRequest,
  UpdateDonationRequest,
  DonationFilters,
  DonationSummary
} from './donation'

export { DonationKind } from './donation'

// Donation Target Types
export type {
  DonationTarget,
  CreateDonationTargetRequest,
  UpdateDonationTargetRequest,
  DonationTargetReport
} from './donationTarget'

// Donation Fund Types
export type {
  DonationFund,
  CreateDonationFundRequest,
  UpdateDonationFundRequest,
  DonationFundFilters,
  FundMovement,
  SaveFundMovementRequest
} from './donationFund'

export { FundMovementType } from './donationFund'

// Recurring Payment Types
export type {
  RecurringPayment,
  CreateRecurringPaymentRequest,
  UpdateRecurringPaymentRequest,
  RecurringPaymentFilters,
  RecurringPaymentOccurrence,
  RecurringPaymentOccurrences,
  PayRecurringPaymentRequest,
  PayRecurringPaymentResult
} from './recurringPayment'

export { RecurringPaymentKind } from './recurringPayment'

// Debt Types
export type {
  Debt,
  CreateDebtRequest,
  UpdateDebtRequest,
  DebtFilters,
  DebtSummary,
  DebtPayment,
  SaveDebtPaymentRequest,
  ExchangeRate,
  SaveExchangeRateRequest
} from './debt'

export { Currency } from './debt'

// Vehicle Types
export type {
  Vehicle,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  VehicleObligation,
  SaveVehicleObligationRequest,
  VehicleReminder
} from './vehicle'

export { VehicleObligationType } from './vehicle'

// Dashboard Types
export type { Dashboard } from './dashboard'

// Ledger (yıllık tablo) Types
export type {
  LedgerItem,
  CreateLedgerItemRequest,
  UpdateLedgerItemRequest,
  LedgerRowSource,
  LedgerRow,
  LedgerYear
} from './ledger'

export { LedgerDirection } from './ledger'

// Permission Types
export type { Permission } from './permission'
export { PermissionType } from './permission'

// UI Types
export type {
  NavigationItem,
  BreadcrumbItem,
  TableHeader,
  DataTableOptions,
  FormField
} from './ui'

// Store Types
export type {
  AuthState,
  UserState,
  RoleState,
  PermissionState
} from './store'

// Component Props
export type {
  BaseDialogProps,
  ConfirmDialogProps,
  UserDialogProps,
  RoleDialogProps
} from './component'

// Config Types
export type { AppConfig } from './config'

// Common Types
export type {
  Nullable,
  Optional,
  DeepPartial,
  DashboardStats,
  MenuItem,
  UserPreferences
} from './common'

// Household Types
export type {
  InvitationStatus,
  HouseholdDetail,
  HouseholdMember,
  HouseholdInvitation,
  HouseholdInvitationSendResult,
  InvitationInfo,
  HouseholdRef,
  AccountDeletionPreview
} from './household'

export { HouseholdRoleValue } from './household'
