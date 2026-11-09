// Bağış hedefi raporu yardımcıları (saf). Emanetten dağıtılan bağışlar "verilen"e girmez (backend).

import { z } from 'zod';

import { vmsg } from '@/features/auth/validation';
import type { DonationKind } from '@/lib/domain/enums';
import { amountToInput, parseAmountInput } from '@/lib/format/amountInput';

import type { CreateDonationTargetRequest, DonationTarget, DonationTargetRow } from './types';

/** Backend DonationTargetRules. */
export const TARGET_MIN_YEAR = 2000;
export const TARGET_MAX_YEAR = 2100;
export const TARGET_NOTE_MAX = 200;

export interface TargetProgress {
  /** 0–1 (çubuk); fazla ödemede 1. */
  share: number;
  /** Gösterilen yüzde (fazla ödemede 100'ü geçebilir). */
  percent: number;
  done: boolean;
}

export function targetProgress(row: Pick<DonationTargetRow, 'target' | 'given'>): TargetProgress {
  const ratio = row.target > 0 ? row.given / row.target : 0;
  return {
    share: Math.min(1, Math.max(0, ratio)),
    percent: Math.round(ratio * 100),
    done: row.target > 0 && row.given >= row.target,
  };
}

/** Raporu sırala: önce tamamlanmamışlar (kalan büyükten küçüğe), sonra tamamlananlar. */
export function sortTargetRows(rows: DonationTargetRow[]): DonationTargetRow[] {
  return [...rows].sort((a, b) => {
    const da = targetProgress(a).done;
    const db = targetProgress(b).done;
    if (da !== db) return da ? 1 : -1;
    return b.remaining - a.remaining;
  });
}

export const targetFormSchema = z
  .object({
    year: z.number(),
    kind: z.enum(['Donation', 'Zakat', 'Scholarship']).nullable(),
    ownerPersonId: z.number().nullable(),
    amount: z.string(),
    note: z.string().max(TARGET_NOTE_MAX, vmsg('validation.maxLength', { max: TARGET_NOTE_MAX })),
  })
  .superRefine((v, ctx) => {
    if (v.kind == null)
      ctx.addIssue({ code: 'custom', path: ['kind'], message: 'validation.required' });
    const amount = parseAmountInput(v.amount);
    if (amount === null)
      ctx.addIssue({ code: 'custom', path: ['amount'], message: 'validation.required' });
    else if (amount <= 0)
      ctx.addIssue({ code: 'custom', path: ['amount'], message: 'validation.positive' });
    if (v.year < TARGET_MIN_YEAR || v.year > TARGET_MAX_YEAR) {
      ctx.addIssue({
        code: 'custom',
        path: ['year'],
        message: vmsg('validation.range', { min: TARGET_MIN_YEAR, max: TARGET_MAX_YEAR }),
      });
    }
  });

export type TargetFormValues = z.infer<typeof targetFormSchema>;

export function targetToForm(target: DonationTarget | undefined, year: number): TargetFormValues {
  return {
    year: target?.year ?? year,
    kind: target?.kind ?? null,
    ownerPersonId: target?.ownerPersonId ?? null,
    amount: amountToInput(target?.amount, 'TRY'),
    note: target?.note ?? '',
  };
}

export function targetFormToRequest(v: TargetFormValues): CreateDonationTargetRequest {
  return {
    year: v.year,
    kind: v.kind as DonationKind,
    ownerPersonId: v.ownerPersonId,
    amount: parseAmountInput(v.amount) ?? 0,
    note: v.note.trim() || null,
  };
}
