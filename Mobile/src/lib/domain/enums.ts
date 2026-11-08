/* eslint-disable @typescript-eslint/no-redeclare -- enum yerine "sabit nesne + aynı adlı tip" kalıbı (ör. Currency.USD ve Currency tipi) */
// Backend enum'larının aynası (JSON'da string olarak gelir; JsonStringEnumConverter).
// Etiketler çeviriden gelir: enumLabel('currency', 'USD') → "Dolar" / "US dollar".

import { t } from '@/lib/i18n';

export const Currency = { TRY: 'TRY', USD: 'USD', EUR: 'EUR', QuarterGold: 'QuarterGold' } as const;
export type Currency = (typeof Currency)[keyof typeof Currency];
/** Kur girilebilen birimler (TRY'nin kuru yoktur). */
export const FOREIGN_CURRENCIES: readonly Currency[] = ['USD', 'EUR', 'QuarterGold'];

export const PaymentMethodType = { Cash: 'Cash', BankAccount: 'BankAccount', CreditCard: 'CreditCard', MealCard: 'MealCard' } as const;
export type PaymentMethodType = (typeof PaymentMethodType)[keyof typeof PaymentMethodType];

export const RecurringPaymentKind = {
  Subscription: 'Subscription',
  Bill: 'Bill',
  Installment: 'Installment',
  Donation: 'Donation',
} as const;
export type RecurringPaymentKind = (typeof RecurringPaymentKind)[keyof typeof RecurringPaymentKind];

export const DonationKind = { Donation: 'Donation', Zakat: 'Zakat', Scholarship: 'Scholarship' } as const;
export type DonationKind = (typeof DonationKind)[keyof typeof DonationKind];

export const FundMovementType = { Use: 'Use', Return: 'Return' } as const;
export type FundMovementType = (typeof FundMovementType)[keyof typeof FundMovementType];

export const VehicleObligationType = {
  TrafficInsurance: 'TrafficInsurance',
  Kasko: 'Kasko',
  Inspection: 'Inspection',
  Mtv: 'Mtv',
} as const;
export type VehicleObligationType = (typeof VehicleObligationType)[keyof typeof VehicleObligationType];

export const LedgerDirection = { Income: 'Income', Expense: 'Expense' } as const;
export type LedgerDirection = (typeof LedgerDirection)[keyof typeof LedgerDirection];

export type HouseholdRole = 'Admin' | 'Member';

/** Çeviri dosyasındaki enum grubu (enums.<grup>.<değer>). */
export type EnumGroup =
  | 'currency'
  | 'paymentMethodType'
  | 'recurringPaymentKind'
  | 'donationKind'
  | 'fundMovementType'
  | 'vehicleObligationType'
  | 'ledgerDirection'
  | 'householdRole';

/** Enum değerinin görünen adı; bilinmeyen değer olduğu gibi döner. */
export function enumLabel(group: EnumGroup, value: string | null | undefined): string {
  if (!value) return '';
  return t(`enums.${group}.${value}`, { defaultValue: value });
}

/** Seçici listeleri için: [{ value, label }]. */
export function enumOptions<T extends string>(group: EnumGroup, values: Record<string, T>): { value: T; label: string }[] {
  return Object.values(values).map((value) => ({ value, label: enumLabel(group, value) }));
}
