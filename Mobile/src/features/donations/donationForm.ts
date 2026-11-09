// Bağış formu: şema ve form ↔ istek dönüşümü (saf). Backend CreateDonationCommandValidator aynası:
// tutar > 0, tarih, tür, alıcı (≤100), ödeme aracı zorunlu; not ≤200.
// Emanetten verilen bağış emanetle aynı türde olur (tür emanetten gelir, değiştirilemez).

import { z } from 'zod';

import { vmsg } from '@/features/auth/validation';
import type { DonationKind } from '@/lib/domain/enums';
import { amountToInput, parseAmountInput } from '@/lib/format/amountInput';

import type { CreateDonationRequest, DonationListItem } from './types';

export const RECIPIENT_MAX = 100;
export const NOTE_MAX = 200;

export const donationFormSchema = z
  .object({
    amount: z.string(),
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
  return {
    amount: amountToInput(d.amount, 'TRY'),
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

export function donationFormToRequest(v: DonationFormValues): CreateDonationRequest {
  return {
    date: v.date,
    amount: parseAmountInput(v.amount) ?? 0,
    kind: v.kind as DonationKind,
    recipient: v.recipient.trim(),
    giverPersonId: v.giverPersonId,
    paymentMethodId: v.paymentMethodId ?? 0,
    note: v.note.trim() || null,
    fundId: v.useFund ? v.fundId : null,
  };
}
