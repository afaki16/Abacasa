// Emanet ve emanet hareketi formları (saf): şema, dönüşüm, ilerleme.
// Emanet hiçbir toplama girmez. Elde = kalan − kullanımda (sıfırın altına düşemez; backend hesaplar).

import { z } from 'zod';

import { vmsg } from '@/features/auth/validation';
import type { DonationKind, FundMovementType } from '@/lib/domain/enums';
import { amountToInput, parseAmountInput } from '@/lib/format/amountInput';

import type {
  CreateDonationFundRequest,
  DonationFund,
  FundMovement,
  SaveFundMovementRequest,
} from './types';

export const FUND_NOTE_MAX = 200;

/** Dağıtılan / alınan (çubuk); 0–1. */
export function fundProgress(f: Pick<DonationFund, 'amount' | 'distributed'>): number {
  if (f.amount <= 0) return 0;
  return Math.max(0, Math.min(1, f.distributed / f.amount));
}

const amountIssue = (raw: string): string | null => {
  const n = parseAmountInput(raw);
  if (n === null) return 'validation.required';
  if (n <= 0) return 'validation.positive';
  return null;
};

export const fundFormSchema = z
  .object({
    fromPersonId: z.number().nullable(),
    kind: z.enum(['Donation', 'Zakat', 'Scholarship']).nullable(),
    amount: z.string(),
    date: z.string().min(1, 'validation.required'),
    note: z.string().max(FUND_NOTE_MAX, vmsg('validation.maxLength', { max: FUND_NOTE_MAX })),
  })
  .superRefine((v, ctx) => {
    if (v.fromPersonId == null)
      ctx.addIssue({ code: 'custom', path: ['fromPersonId'], message: 'validation.required' });
    if (v.kind == null)
      ctx.addIssue({ code: 'custom', path: ['kind'], message: 'validation.required' });
    const a = amountIssue(v.amount);
    if (a) ctx.addIssue({ code: 'custom', path: ['amount'], message: a });
  });

export type FundFormValues = z.infer<typeof fundFormSchema>;

export function fundToForm(fund: DonationFund | undefined, today: string): FundFormValues {
  return {
    fromPersonId: fund?.fromPersonId ?? null,
    kind: fund?.kind ?? null,
    amount: amountToInput(fund?.amount, 'TRY'),
    date: fund?.date.slice(0, 10) ?? today,
    note: fund?.note ?? '',
  };
}

export function fundFormToRequest(v: FundFormValues): CreateDonationFundRequest {
  return {
    fromPersonId: v.fromPersonId ?? 0,
    kind: v.kind as DonationKind,
    amount: parseAmountInput(v.amount) ?? 0,
    date: v.date,
    note: v.note.trim() || null,
  };
}

export interface MovementFormValues {
  type: FundMovementType;
  date: string;
  amount: string;
  note: string;
}

/** Hareket formu doğrulaması; alan → mesaj anahtarı. */
export function validateMovement(
  v: MovementFormValues,
): Partial<Record<keyof MovementFormValues, string>> {
  const errors: Partial<Record<keyof MovementFormValues, string>> = {};
  const a = amountIssue(v.amount);
  if (a) errors.amount = a;
  if (!v.date) errors.date = 'validation.required';
  if (v.note.trim().length > FUND_NOTE_MAX)
    errors.note = vmsg('validation.maxLength', { max: FUND_NOTE_MAX });
  return errors;
}

export function movementToForm(m: FundMovement | null, today: string): MovementFormValues {
  return {
    type: m?.type ?? 'Use',
    date: m?.date.slice(0, 10) ?? today,
    amount: amountToInput(m?.amount, 'TRY'),
    note: m?.note ?? '',
  };
}

export function movementFormToRequest(v: MovementFormValues): SaveFundMovementRequest {
  return {
    type: v.type,
    date: v.date,
    amount: parseAmountInput(v.amount) ?? 0,
    note: v.note.trim() || null,
  };
}
