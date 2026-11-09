import {
  sortTargetRows,
  targetFormSchema,
  targetFormToRequest,
  targetProgress,
  targetToForm,
} from '../report';
import type { DonationTargetRow } from '../types';

const row = (patch: Partial<DonationTargetRow>): DonationTargetRow => ({
  targetId: 1,
  ownerPersonId: null,
  ownerName: null,
  kind: 'Zakat',
  target: 15000,
  given: 12000,
  planned: 0,
  expectedYearEnd: 12000,
  remaining: 3000,
  remainingAfterPlan: 3000,
  ...patch,
});

describe('bağış hedefi', () => {
  it('ilerleme; fazla ödemede çubuk 1, yüzde 100’ü geçer', () => {
    expect(targetProgress(row({}))).toEqual({ share: 0.8, percent: 80, done: false });
    expect(targetProgress(row({ given: 18000 }))).toEqual({ share: 1, percent: 120, done: true });
    expect(targetProgress(row({ target: 0, given: 0 })).done).toBe(false);
  });

  it('tamamlanmayanlar önce, kalan büyükten küçüğe', () => {
    const sorted = sortTargetRows([
      row({ targetId: 1, given: 15000, remaining: 0 }),
      row({ targetId: 2, remaining: 1000 }),
      row({ targetId: 3, remaining: 5000 }),
    ]);
    expect(sorted.map((r) => r.targetId)).toEqual([3, 2, 1]);
  });

  it('form doğrulaması ve isteğe çevirme', () => {
    const empty = targetToForm(undefined, 2026);
    const r = targetFormSchema.safeParse(empty);
    expect(r.success).toBe(false);
    const v = { ...empty, kind: 'Scholarship' as const, amount: '12000', note: '  ' };
    expect(targetFormSchema.safeParse(v).success).toBe(true);
    expect(targetFormToRequest(v)).toEqual({
      year: 2026,
      kind: 'Scholarship',
      ownerPersonId: null,
      amount: 12000,
      note: null,
    });
    expect(targetFormSchema.safeParse({ ...v, year: 1999 }).success).toBe(false);
  });
});
