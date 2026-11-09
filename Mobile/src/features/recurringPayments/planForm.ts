// Sabit ödeme planı formu: şema ve form ↔ istek dönüşümü (saf). Kurallar backend
// RecurringPaymentFieldsValidator'ın aynası:
//   - Abonelik / fatura / bağış: başlangıç ayı (ayın 1'i) ve vade günü (1–31).
//   - Abonelik / fatura / taksit: kategori zorunlu. Bağış: alıcı (≤100) ve bağış türü zorunlu.
//   - Taksit: toplam tutar > 0, taksit sayısı 2–120, ilk taksit tarihi.
// Tasarımdaki seçim düzeni: Tür (Harcama / Bağış) → Ödeme tipi (Aylık / Taksitli) → aylık harcamada
// Abonelik / Fatura. Bunlar tek bir RecurringPaymentKind'e çevrilir.

import { z } from 'zod';

import { vmsg } from '@/features/auth/validation';
import type { DonationKind, RecurringPaymentKind } from '@/lib/domain/enums';
import { amountToInput, parseAmountInput } from '@/lib/format/amountInput';

import type { CreateRecurringPaymentRequest, RecurringPaymentListItem } from './types';

export type PlanGroup = 'expense' | 'donation';
export type PlanSchedule = 'monthly' | 'installment';
export type MonthlyExpenseKind = 'Subscription' | 'Bill';

export const DUE_DAY_MIN = 1;
export const DUE_DAY_MAX = 31;
export const INSTALLMENT_MIN = 2;
export const INSTALLMENT_MAX = 120;
export const NAME_MAX = 100;
export const RECIPIENT_MAX = 100;

/** Seçimlerden plan türü. Bağış her zaman aylıktır. */
export function kindFromChoice(
  group: PlanGroup,
  schedule: PlanSchedule,
  monthlyKind: MonthlyExpenseKind,
): RecurringPaymentKind {
  if (group === 'donation') return 'Donation';
  return schedule === 'installment' ? 'Installment' : monthlyKind;
}

/** Plan türünden seçimler (düzenleme formunun başlangıç değerleri). */
export function choiceFromKind(kind: RecurringPaymentKind): {
  group: PlanGroup;
  schedule: PlanSchedule;
  monthlyKind: MonthlyExpenseKind;
} {
  switch (kind) {
    case 'Donation':
      return { group: 'donation', schedule: 'monthly', monthlyKind: 'Bill' };
    case 'Installment':
      return { group: 'expense', schedule: 'installment', monthlyKind: 'Bill' };
    case 'Subscription':
      return { group: 'expense', schedule: 'monthly', monthlyKind: 'Subscription' };
    default:
      return { group: 'expense', schedule: 'monthly', monthlyKind: 'Bill' };
  }
}

/** Aylık taksit önizlemesi (kuruşa yuvarlı); hesaplanamıyorsa null. */
export function installmentAmount(total: number | null, count: number | null): number | null {
  if (!total || !count || total <= 0 || count < 1) return null;
  return Math.round((total / count) * 100) / 100;
}

const positiveAmount = (raw: string) => {
  const n = parseAmountInput(raw);
  return n !== null && n > 0;
};

export const planFormSchema = z
  .object({
    name: z.string(),
    group: z.enum(['expense', 'donation']),
    schedule: z.enum(['monthly', 'installment']),
    monthlyKind: z.enum(['Subscription', 'Bill']),
    paymentMethodId: z.number().nullable(),
    ownerPersonId: z.number().nullable(),
    categoryId: z.number().nullable(),
    donationKind: z.enum(['Donation', 'Zakat', 'Scholarship']).nullable(),
    recipient: z.string(),
    startYear: z.number(),
    startMonth: z.number(),
    dueDay: z.number().nullable(),
    /** Ham tutar ("1234,5"); boşsa tutar belli değil. */
    expectedAmount: z.string(),
    totalAmount: z.string(),
    installmentCount: z.string(),
    firstDueDate: z.string().nullable(),
    isActive: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message });
    const name = v.name.trim();
    if (!name) issue('name', 'validation.required');
    else if (name.length > NAME_MAX) issue('name', vmsg('validation.maxLength', { max: NAME_MAX }));
    if (v.paymentMethodId == null) issue('paymentMethodId', 'validation.required');
    if (v.expectedAmount && !positiveAmount(v.expectedAmount))
      issue('expectedAmount', 'validation.positive');

    const kind = kindFromChoice(v.group, v.schedule, v.monthlyKind);
    if (kind !== 'Donation' && v.categoryId == null) issue('categoryId', 'validation.required');
    if (kind === 'Donation') {
      const recipient = v.recipient.trim();
      if (!recipient) issue('recipient', 'validation.required');
      else if (recipient.length > RECIPIENT_MAX)
        issue('recipient', vmsg('validation.maxLength', { max: RECIPIENT_MAX }));
      if (v.donationKind == null) issue('donationKind', 'validation.required');
    }
    if (kind === 'Installment') {
      if (!v.totalAmount) issue('totalAmount', 'validation.required');
      else if (!positiveAmount(v.totalAmount)) issue('totalAmount', 'validation.positive');
      const count = Number(v.installmentCount);
      if (!v.installmentCount.trim()) issue('installmentCount', 'validation.required');
      else if (!Number.isInteger(count) || count < INSTALLMENT_MIN || count > INSTALLMENT_MAX) {
        issue(
          'installmentCount',
          vmsg('validation.range', { min: INSTALLMENT_MIN, max: INSTALLMENT_MAX }),
        );
      }
      if (!v.firstDueDate) issue('firstDueDate', 'validation.required');
    } else if (v.dueDay == null) {
      issue('dueDay', 'validation.required');
    } else if (v.dueDay < DUE_DAY_MIN || v.dueDay > DUE_DAY_MAX) {
      issue('dueDay', vmsg('validation.range', { min: DUE_DAY_MIN, max: DUE_DAY_MAX }));
    }
  });

export type PlanFormValues = z.infer<typeof planFormSchema>;

const pad = (n: number) => String(n).padStart(2, '0');

/** Yeni plan formu başlangıç değerleri (başlangıç ayı: bugünün ayı). */
export function emptyPlanForm(today: string, group: PlanGroup = 'expense'): PlanFormValues {
  const [y, m] = today.split('-').map(Number);
  return {
    name: '',
    group,
    schedule: 'monthly',
    monthlyKind: 'Bill',
    paymentMethodId: null,
    ownerPersonId: null,
    categoryId: null,
    donationKind: null,
    recipient: '',
    startYear: y,
    startMonth: m,
    dueDay: null,
    expectedAmount: '',
    totalAmount: '',
    installmentCount: '',
    firstDueDate: null,
    isActive: true,
  };
}

export function planToForm(plan: RecurringPaymentListItem, today: string): PlanFormValues {
  const base = emptyPlanForm(today);
  const [sy, sm] = (plan.startMonth ?? '').split('-').map(Number);
  return {
    ...base,
    ...choiceFromKind(plan.kind),
    name: plan.name,
    paymentMethodId: plan.paymentMethodId,
    ownerPersonId: plan.ownerPersonId,
    categoryId: plan.categoryId,
    donationKind: plan.donationKind,
    recipient: plan.recipient ?? '',
    startYear: sy || base.startYear,
    startMonth: sm || base.startMonth,
    dueDay: plan.kind === 'Installment' ? null : plan.dueDay,
    expectedAmount: plan.kind === 'Installment' ? '' : amountToInput(plan.expectedAmount, 'TRY'),
    totalAmount: amountToInput(plan.totalAmount, 'TRY'),
    installmentCount: plan.installmentCount != null ? String(plan.installmentCount) : '',
    firstDueDate: plan.firstDueDate,
    isActive: plan.isActive,
  };
}

/** Form → istek. Türe ait olmayan alanlar null gönderilir (backend "izin verilmez" der). */
export function planFormToRequest(v: PlanFormValues): CreateRecurringPaymentRequest {
  const kind = kindFromChoice(v.group, v.schedule, v.monthlyKind);
  const installment = kind === 'Installment';
  const donation = kind === 'Donation';
  return {
    name: v.name.trim(),
    kind,
    paymentMethodId: v.paymentMethodId ?? 0,
    ownerPersonId: v.ownerPersonId,
    categoryId: donation ? null : v.categoryId,
    recipient: donation ? v.recipient.trim() : null,
    donationKind: donation ? (v.donationKind as DonationKind) : null,
    expectedAmount: installment ? null : parseAmountInput(v.expectedAmount),
    dueDay: installment ? null : v.dueDay,
    startMonth: installment ? null : `${v.startYear}-${pad(v.startMonth)}-01`,
    totalAmount: installment ? parseAmountInput(v.totalAmount) : null,
    installmentCount: installment ? Number(v.installmentCount) : null,
    firstDueDate: installment ? v.firstDueDate : null,
  };
}
