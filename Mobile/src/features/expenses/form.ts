// Harcama formu: şema (backend CreateExpenseCommandValidator aynası), form ↔ istek dönüşümü ve
// sunucu alan hatalarının form alanlarına eşlenmesi. Saf; testlidir.
// Harcamalar yalnızca TL'dir (backend'de para birimi alanı yok).

import { z } from 'zod';

import { toNullable, vmsg } from '@/features/auth/validation';
import { amountToInput, parseAmountInput } from '@/lib/format/amountInput';

import type { CreateExpenseRequest, Expense } from './types';

export const DESCRIPTION_MAX = 200;

export const expenseFormSchema = z.object({
  /** AmountField ham değeri ("1234,5"). */
  amount: z.string().refine((v) => (parseAmountInput(v) ?? 0) > 0, 'validation.positive'),
  /** 'YYYY-MM-DD' */
  date: z.string().min(1, 'validation.required'),
  categoryId: z.number().nullable().refine((v): boolean => v !== null, 'expenses.validation.categoryRequired'),
  paymentMethodId: z.number().nullable().refine((v): boolean => v !== null, 'expenses.validation.paymentMethodRequired'),
  /** Boşsa harcama hanenindir. */
  ownerPersonId: z.number().nullable(),
  description: z.string().max(DESCRIPTION_MAX, vmsg('validation.maxLength', { max: DESCRIPTION_MAX })),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export type ExpenseFormField = keyof ExpenseFormValues;

/** Yeni kayıt varsayılanları; "Kaydet ve yeni ekle"de tarih, kategori, ödeme aracı ve kişi korunur. */
export function emptyExpenseValues(today: string, keep?: Partial<ExpenseFormValues>): ExpenseFormValues {
  return {
    amount: '',
    date: keep?.date ?? today,
    categoryId: keep?.categoryId ?? null,
    paymentMethodId: keep?.paymentMethodId ?? null,
    ownerPersonId: keep?.ownerPersonId ?? null,
    description: '',
  };
}

export function expenseToValues(expense: Expense): ExpenseFormValues {
  return {
    amount: amountToInput(expense.amount, 'TRY'),
    date: expense.date.slice(0, 10),
    categoryId: expense.categoryId,
    paymentMethodId: expense.paymentMethodId,
    ownerPersonId: expense.ownerPersonId,
    description: expense.description ?? '',
  };
}

/** Şemadan geçmiş değerler → istek gövdesi. */
export function valuesToRequest(values: ExpenseFormValues): CreateExpenseRequest {
  return {
    date: values.date,
    amount: parseAmountInput(values.amount) ?? 0,
    description: toNullable(values.description),
    categoryId: values.categoryId ?? 0,
    paymentMethodId: values.paymentMethodId ?? 0,
    ownerPersonId: values.ownerPersonId,
  };
}

const SERVER_FIELDS: Record<string, ExpenseFormField> = {
  amount: 'amount',
  date: 'date',
  categoryid: 'categoryId',
  paymentmethodid: 'paymentMethodId',
  ownerpersonid: 'ownerPersonId',
  description: 'description',
};

/**
 * Backend alan hataları ({ "Amount": ["..."] }, büyük/küçük harf fark etmez) → form alanları;
 * eşlenemeyenler form üstü banda (rest).
 */
export function mapServerErrors(fieldErrors: Record<string, string[]>): {
  fields: { name: ExpenseFormField; message: string }[];
  rest: string[];
} {
  const fields: { name: ExpenseFormField; message: string }[] = [];
  const rest: string[] = [];
  for (const [key, messages] of Object.entries(fieldErrors)) {
    const name = SERVER_FIELDS[key.split('.').pop()!.toLowerCase()];
    const message = messages.find(Boolean);
    if (!message) continue;
    if (name) fields.push({ name, message });
    else rest.push(...messages.filter(Boolean));
  }
  return { fields, rest };
}
