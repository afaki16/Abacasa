// Bütçe formu ve rapor yardımcıları (saf).

import { z } from 'zod';

import { vmsg } from '@/features/auth/validation';
import { amountToInput, parseAmountInput } from '@/lib/format/amountInput';

import type { Budget, CreateBudgetRequest } from './types';

/** Backend BudgetRules. */
export const BUDGET_MIN_YEAR = 2000;
export const BUDGET_MAX_YEAR = 2100;
export const BUDGET_NOTE_MAX = 200;

export type UsageTone = 'normal' | 'warning' | 'over';

/** %80'e kadar normal, %100'e kadar uyarı, üstü aşıldı. */
export function usageTone(usedPercent: number): UsageTone {
  if (usedPercent > 100) return 'over';
  if (usedPercent >= 80) return 'warning';
  return 'normal';
}

/** Çubuk için 0–1. */
export function usageShare(usedPercent: number): number {
  return Math.max(0, Math.min(1, (Number.isFinite(usedPercent) ? usedPercent : 0) / 100));
}

export const budgetFormSchema = z
  .object({
    ownerPersonId: z.number().nullable(),
    startYear: z.number(),
    startMonth: z.number(),
    amount: z.string(),
    note: z.string().max(BUDGET_NOTE_MAX, vmsg('validation.maxLength', { max: BUDGET_NOTE_MAX })),
  })
  .superRefine((v, ctx) => {
    // 0 geçerli: o aydan itibaren bütçe yok
    const amount = parseAmountInput(v.amount);
    if (amount === null) ctx.addIssue({ code: 'custom', path: ['amount'], message: 'validation.required' });
    else if (amount < 0) ctx.addIssue({ code: 'custom', path: ['amount'], message: 'validation.positive' });
    if (v.startYear < BUDGET_MIN_YEAR || v.startYear > BUDGET_MAX_YEAR) {
      ctx.addIssue({
        code: 'custom',
        path: ['startYear'],
        message: vmsg('validation.range', { min: BUDGET_MIN_YEAR, max: BUDGET_MAX_YEAR }),
      });
    }
    if (v.startMonth < 1 || v.startMonth > 12) {
      ctx.addIssue({ code: 'custom', path: ['startMonth'], message: vmsg('validation.range', { min: 1, max: 12 }) });
    }
  });

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;

export function budgetToForm(budget: Budget | undefined, year: number, month: number): BudgetFormValues {
  return {
    ownerPersonId: budget?.ownerPersonId ?? null,
    startYear: budget?.startYear ?? year,
    startMonth: budget?.startMonth ?? month,
    amount: amountToInput(budget?.amount, 'TRY'),
    note: budget?.note ?? '',
  };
}

export function budgetFormToRequest(v: BudgetFormValues): CreateBudgetRequest {
  return {
    ownerPersonId: v.ownerPersonId,
    startYear: v.startYear,
    startMonth: v.startMonth,
    amount: parseAmountInput(v.amount) ?? 0,
    note: v.note.trim() || null,
  };
}
