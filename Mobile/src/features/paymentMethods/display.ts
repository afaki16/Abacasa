// Ödeme araçları listesi ve formu için saf yardımcılar.

import type { IconName } from '@/components/ui';
import type { PaymentMethodType } from '@/lib/domain/enums';

import type { CreatePaymentMethodRequest, PaymentMethod } from './types';

export const PAYMENT_METHOD_TYPES: readonly PaymentMethodType[] = [
  'CreditCard',
  'BankAccount',
  'Cash',
  'MealCard',
];

export const PAYMENT_METHOD_ICONS: Record<PaymentMethodType, IconName> = {
  CreditCard: 'credit-card',
  BankAccount: 'account-balance',
  Cash: 'payments',
  MealCard: 'lunch-dining',
};

/** Aktif / pasif bölümleri (backend sırası korunur). */
export function splitByActive<T extends Pick<PaymentMethod, 'isActive'>>(
  methods: readonly T[],
): { active: T[]; inactive: T[] } {
  return {
    active: methods.filter((m) => m.isActive),
    inactive: methods.filter((m) => !m.isActive),
  };
}

/**
 * Satırın alt satırı: sahip (yoksa "Ortak") · banka · kesim günü (kredi kartı) · yemek kartı notu.
 * Metinler çağırandan gelir (dil bağımsız, test edilebilir).
 */
export function paymentMethodMeta(
  method: Pick<PaymentMethod, 'type' | 'bank' | 'ownerPersonName' | 'statementDay'>,
  labels: { shared: string; statementDay: (day: number) => string; mealCardNote: string },
): string {
  return [
    method.ownerPersonName ?? labels.shared,
    method.bank,
    method.type === 'CreditCard' && method.statementDay
      ? labels.statementDay(method.statementDay)
      : null,
    method.type === 'MealCard' ? labels.mealCardNote : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

export interface PaymentMethodFormValues {
  name: string;
  type: PaymentMethodType;
  bank: string;
  ownerPersonId: number | null;
  /** Ham metin ("15"). */
  statementDay: string;
  isActive: boolean;
}

/**
 * Form → istek. Backend kuralı: kesim günü yalnızca kredi kartında (zorunlu, 1–31), diğer türlerde boş
 * olmalı. Nakitte banka gönderilmez.
 */
export function toPaymentMethodRequest(
  values: PaymentMethodFormValues,
): CreatePaymentMethodRequest {
  const bank = values.type === 'Cash' ? '' : values.bank.trim();
  const day = Number(values.statementDay);
  return {
    name: values.name.trim(),
    type: values.type,
    bank: bank || null,
    ownerPersonId: values.ownerPersonId,
    statementDay: values.type === 'CreditCard' && Number.isInteger(day) && day > 0 ? day : null,
    isActive: values.isActive,
  };
}
