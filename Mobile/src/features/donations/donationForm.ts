// Bağış formu: şema ve form ↔ istek dönüşümü (saf). Backend CreateDonationCommandValidator aynası:
// tutar > 0, tarih, tür, alıcı (≤100), ödeme aracı zorunlu; not ≤200.
// Emanetten verilen bağış emanetle aynı türde olur (tür emanetten gelir, değiştirilemez).
// Dövizli bağış (USD, EUR, çeyrek): tutar birim cinsinden (çeyrekte adet), kur zorunlu (bağış günündeki kur
// önerilir); TL karşılığı = tutar × kur. Emanetten dağıtım yalnızca TL.

import { z } from 'zod';

import { vmsg } from '@/features/auth/validation';
import { rateToInput } from '@/features/debts/debtForm';
import type { Currency, DonationKind } from '@/lib/domain/enums';
import { amountToInput, parseAmountInput } from '@/lib/format/amountInput';

import type { CreateDonationRequest, DonationListItem } from './types';

export const RECIPIENT_MAX = 100;
export const NOTE_MAX = 200;

export const donationFormSchema = z
  .object({
    amount: z.string(),
    currency: z.enum(['TRY', 'USD', 'EUR', 'QuarterGold']),
    rate: z.string(),
    date: z.string().min(1, 'validation.required'),
    kind: z.enum(['Donation', 'Zakat', 'Scholarship']).nullable(),
    recipient: z.string(),
    giverPersonId: z.number().nullable(),
    paymentMethodId: z.number().nullable(),
    note: z.string().max(NOTE_MAX, vmsg('validation.maxLength', { max: NOTE_MAX })),
    useFund: z.boolean(),
    fundId: z.number().nullable(),
  })
  .superRefine((v, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message });
    const amount = parseAmountInput(v.amount);
    if (amount === null) issue('amount', 'validation.required');
    else if (amount <= 0) issue('amount', 'validation.positive');
    if (v.currency !== 'TRY') {
      const rate = parseAmountInput(v.rate);
      if (rate === null) issue('rate', 'validation.required');
      else if (rate <= 0) issue('rate', 'validation.positive');
    }
    if (v.kind == null) issue('kind', 'validation.required');
    const recipient = v.recipient.trim();
    if (!recipient) issue('recipient', 'validation.required');
    else if (recipient.length > RECIPIENT_MAX)
      issue('recipient', vmsg('validation.maxLength', { max: RECIPIENT_MAX }));
    if (v.paymentMethodId == null) issue('paymentMethodId', 'validation.required');
    if (v.useFund && v.fundId == null) issue('fundId', 'validation.required');
  });

export type DonationFormValues = z.infer<typeof donationFormSchema>;

export function emptyDonationForm(
  today: string,
  fund?: { id: number; kind: DonationKind } | null,
): DonationFormValues {
  return {
    amount: '',
    currency: 'TRY',
    rate: '',
    date: today,
    kind: fund?.kind ?? null,
    recipient: '',
    giverPersonId: null,
    paymentMethodId: null,
    note: '',
    useFund: !!fund,
    fundId: fund?.id ?? null,
  };
}

export function donationToForm(d: DonationListItem): DonationFormValues {
  const currency: Currency = d.currency ?? 'TRY';
  const foreign = currency !== 'TRY';
  return {
    amount: foreign ? amountToInput(d.foreignAmount, currency) : amountToInput(d.amount, 'TRY'),
    currency,
    rate: foreign ? rateToInput(d.exchangeRate) : '',
    date: d.date.slice(0, 10),
    kind: d.kind,
    recipient: d.recipient,
    giverPersonId: d.giverPersonId,
    paymentMethodId: d.paymentMethodId,
    note: d.note ?? '',
    useFund: d.fundId != null,
    fundId: d.fundId,
  };
}

/** Dövizli bağışın TL karşılığı (tutar × kur, kuruşa yuvarlı); hesaplanamıyorsa null. */
export function donationInTry(amountRaw: string, rateRaw: string): number | null {
  const a = parseAmountInput(amountRaw);
  const r = parseAmountInput(rateRaw);
  if (a === null || r === null) return null;
  return Math.round(a * r * 100) / 100;
}

export function donationFormToRequest(v: DonationFormValues): CreateDonationRequest {
  const foreign = v.currency !== 'TRY';
  const amount = parseAmountInput(v.amount) ?? 0;
  return {
    date: v.date,
    amount: foreign ? (donationInTry(v.amount, v.rate) ?? 0) : amount,
    currency: v.currency,
    foreignAmount: foreign ? amount : null,
    exchangeRate: foreign ? parseAmountInput(v.rate) : null,
    kind: v.kind as DonationKind,
    recipient: v.recipient.trim(),
    giverPersonId: v.giverPersonId,
    paymentMethodId: v.paymentMethodId ?? 0,
    note: v.note.trim() || null,
    // Emanetten dağıtım yalnızca TL
    fundId: v.useFund && !foreign ? v.fundId : null,
  };
}
