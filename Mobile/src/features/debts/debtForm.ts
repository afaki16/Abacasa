// Borç ve borç ödemesi formları + liste yardımcıları (saf). Kurallar backend aynası:
//   - Borç: alacaklı zorunlu, tutar > 0 (çeyrek tam sayı), tarih, not ≤200.
//   - Ödeme: tutar > 0 ve kalanı aşamaz, tarih borç tarihinden önce olamaz, yabancı birimde (döviz,
//     çeyrek) kur zorunlu ve elle girilir (decimal(18,4)), TL'de kur yok.
// Borç alma ve geri ödeme dönem harcamasına girmez.

import { z } from 'zod';

import { vmsg } from '@/features/auth/validation';
import type { Currency } from '@/lib/domain/enums';
import { amountToInput, parseAmountInput } from '@/lib/format/amountInput';

import type {
  CreateDebtRequest,
  DebtListItem,
  DebtPayment,
  DebtSummary,
  SaveDebtPaymentRequest,
} from './types';

export const DEBT_NOTE_MAX = 200;
const RATE_DECIMALS = 4;

// ---------- Liste ----------

export interface CreditorGroup {
  creditorPersonId: number;
  creditorName: string;
  debts: DebtListItem[];
}

/** Alacaklıya göre gruplar (ilk görünme sırasıyla). */
export function groupByCreditor(items: DebtListItem[]): CreditorGroup[] {
  const map = new Map<number, CreditorGroup>();
  for (const d of items) {
    let g = map.get(d.creditorPersonId);
    if (!g) {
      g = { creditorPersonId: d.creditorPersonId, creditorName: d.creditorName, debts: [] };
      map.set(d.creditorPersonId, g);
    }
    g.debts.push(d);
  }
  return [...map.values()];
}

export type DebtListRow =
  | { type: 'header'; key: string; name: string }
  | { type: 'debt'; key: string; debt: DebtListItem; first: boolean; last: boolean };

/** Sanal liste satırları: her alacaklı için başlık + borç kartları. */
export function debtListRows(items: DebtListItem[]): DebtListRow[] {
  return groupByCreditor(items).flatMap((g) => [
    { type: 'header' as const, key: `h-${g.creditorPersonId}`, name: g.creditorName },
    ...g.debts.map((debt, i) => ({
      type: 'debt' as const,
      key: `d-${debt.id}`,
      debt,
      first: i === 0,
      last: i === g.debts.length - 1,
    })),
  ]);
}

/** Ödenen / toplam (0–1). */
export function debtProgress(d: Pick<DebtListItem, 'amount' | 'paidAmount'>): number {
  if (d.amount <= 0) return 0;
  return Math.max(0, Math.min(1, d.paidAmount / d.amount));
}

/** Özet kartının üç sütunu: TL, altın (çeyrek), döviz (USD/EUR açıkları). */
export function summaryColumns(s: Pick<DebtSummary, 'openTry' | 'foreign'>): {
  tryOpen: number;
  goldOpen: number;
  fx: { currency: Currency; open: number }[];
} {
  return {
    tryOpen: s.openTry,
    goldOpen: s.foreign.find((f) => f.currency === 'QuarterGold')?.open ?? 0,
    fx: s.foreign
      .filter((f) => f.currency !== 'QuarterGold' && f.open > 0)
      .map((f) => ({ currency: f.currency, open: f.open })),
  };
}

// ---------- Borç formu ----------

export const debtFormSchema = z
  .object({
    currency: z.enum(['TRY', 'USD', 'EUR', 'QuarterGold']),
    amount: z.string(),
    date: z.string().min(1, 'validation.required'),
    creditorPersonId: z.number().nullable(),
    debtorPersonId: z.number().nullable(),
    note: z.string().max(DEBT_NOTE_MAX, vmsg('validation.maxLength', { max: DEBT_NOTE_MAX })),
  })
  .superRefine((v, ctx) => {
    const n = parseAmountInput(v.amount);
    if (n === null)
      ctx.addIssue({ code: 'custom', path: ['amount'], message: 'validation.required' });
    else if (n <= 0)
      ctx.addIssue({ code: 'custom', path: ['amount'], message: 'validation.positive' });
    else if (v.currency === 'QuarterGold' && !Number.isInteger(n)) {
      ctx.addIssue({ code: 'custom', path: ['amount'], message: 'validation.wholeNumber' });
    }
    if (v.creditorPersonId == null)
      ctx.addIssue({ code: 'custom', path: ['creditorPersonId'], message: 'validation.required' });
  });

export type DebtFormValues = z.infer<typeof debtFormSchema>;

export function debtToForm(d: DebtListItem | undefined, today: string): DebtFormValues {
  return {
    currency: d?.currency ?? 'TRY',
    amount: d ? amountToInput(d.amount, d.currency) : '',
    date: d?.date.slice(0, 10) ?? today,
    creditorPersonId: d?.creditorPersonId ?? null,
    debtorPersonId: d?.debtorPersonId ?? null,
    note: d?.note ?? '',
  };
}

export function debtFormToRequest(v: DebtFormValues): CreateDebtRequest {
  return {
    currency: v.currency,
    amount: parseAmountInput(v.amount) ?? 0,
    date: v.date,
    creditorPersonId: v.creditorPersonId ?? 0,
    debtorPersonId: v.debtorPersonId,
    note: v.note.trim() || null,
  };
}

/** Çeyrek adedi için −/+ adım; 0'ın altına inmez. */
export function stepQuarter(raw: string, delta: number): string {
  const n = Math.trunc(parseAmountInput(raw) ?? 0) + delta;
  return n <= 0 ? '' : String(n);
}

// ---------- Ödeme formu ----------

/** Kur alanı: rakamlar + tek ondalık virgül, en fazla 4 ondalık ("41,8520"). Nokta virgül sayılır. */
export function sanitizeRateInput(raw: string): string {
  let text = raw.replace(/\./g, ',').replace(/[^\d,]/g, '');
  const comma = text.indexOf(',');
  if (comma !== -1) {
    text =
      text.slice(0, comma + 1) +
      text
        .slice(comma + 1)
        .replace(/,/g, '')
        .slice(0, RATE_DECIMALS);
  }
  text = text.replace(/^0+(?=\d)/, '');
  if (text.startsWith(',')) text = `0${text}`;
  return text;
}

/** Kayıtlı kur → alan değeri: 41.852 → "41,8520". */
export function rateToInput(rate: number | null | undefined): string {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) return '';
  return rate.toFixed(RATE_DECIMALS).replace('.', ',');
}

export interface PaymentFormValues {
  date: string;
  amount: string;
  rate: string;
  note: string;
}

export type PaymentFormErrors = Partial<Record<keyof PaymentFormValues, string>>;

/**
 * Ödeme formu doğrulaması. maxAmount: ödenebilecek en fazla tutar (kalan; düzenlemede + ödemenin kendisi).
 */
export function validatePayment(
  v: PaymentFormValues,
  ctx: { currency: Currency; debtDate: string; maxAmount: number; maxText?: string },
): PaymentFormErrors {
  const errors: PaymentFormErrors = {};
  const amount = parseAmountInput(v.amount);
  if (amount === null) errors.amount = 'validation.required';
  else if (amount <= 0) errors.amount = 'validation.positive';
  else if (ctx.currency === 'QuarterGold' && !Number.isInteger(amount))
    errors.amount = 'validation.wholeNumber';
  else if (amount > ctx.maxAmount + 1e-9)
    errors.amount = vmsg('debts.validation.exceedsRemaining', {
      max: ctx.maxText ?? String(ctx.maxAmount),
    });

  if (!v.date) errors.date = 'validation.required';
  else if (v.date < ctx.debtDate.slice(0, 10)) errors.date = 'debts.validation.beforeDebt';

  if (ctx.currency !== 'TRY') {
    const rate = parseAmountInput(v.rate);
    if (rate === null) errors.rate = 'validation.required';
    else if (rate <= 0) errors.rate = 'validation.positive';
  }
  if (v.note.trim().length > DEBT_NOTE_MAX)
    errors.note = vmsg('validation.maxLength', { max: DEBT_NOTE_MAX });
  return errors;
}

export function paymentToForm(
  p: DebtPayment | null,
  currency: Currency,
  today: string,
  suggestedRate?: number | null,
): PaymentFormValues {
  return {
    date: p?.date.slice(0, 10) ?? today,
    amount: p ? amountToInput(p.amount, currency) : '',
    rate: currency === 'TRY' ? '' : rateToInput(p ? p.exchangeRate : suggestedRate),
    note: p?.note ?? '',
  };
}

export function paymentFormToRequest(
  v: PaymentFormValues,
  currency: Currency,
): SaveDebtPaymentRequest {
  return {
    date: v.date,
    amount: parseAmountInput(v.amount) ?? 0,
    exchangeRate: currency === 'TRY' ? null : parseAmountInput(v.rate),
    note: v.note.trim() || null,
  };
}

/** TL karşılığı önizlemesi (tutar × kur), kuruşa yuvarlı; hesaplanamıyorsa null. */
export function paymentInTry(amountRaw: string, rateRaw: string): number | null {
  const a = parseAmountInput(amountRaw);
  const r = parseAmountInput(rateRaw);
  if (a === null || r === null) return null;
  return Math.round(a * r * 100) / 100;
}
