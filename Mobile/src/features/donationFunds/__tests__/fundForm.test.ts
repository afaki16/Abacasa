import {
  fundFormSchema,
  fundFormToRequest,
  fundProgress,
  fundToForm,
  movementFormToRequest,
  movementToForm,
  validateMovement,
} from '../fundForm';

describe('emanet', () => {
  it('dağıtım ilerlemesi 0–1', () => {
    expect(fundProgress({ amount: 10000, distributed: 5800 })).toBeCloseTo(0.58);
    expect(fundProgress({ amount: 100, distributed: 150 })).toBe(1);
    expect(fundProgress({ amount: 0, distributed: 0 })).toBe(0);
  });

  it('form: kimden, tür ve tutar zorunlu', () => {
    const empty = fundToForm(undefined, '2026-11-08');
    const r = fundFormSchema.safeParse(empty);
    expect(r.success).toBe(false);
    const paths = r.success ? [] : r.error.issues.map((i) => i.path[0]);
    expect(paths).toEqual(expect.arrayContaining(['fromPersonId', 'kind', 'amount']));
    const v = { ...empty, fromPersonId: 3, kind: 'Zakat' as const, amount: '10000' };
    expect(fundFormToRequest(v)).toEqual({
      fromPersonId: 3,
      kind: 'Zakat',
      amount: 10000,
      date: '2026-11-08',
      note: null,
    });
  });

  it('hareket: tutar zorunlu ve pozitif, varsayılan Kullanım', () => {
    const v = movementToForm(null, '2026-11-08');
    expect(v.type).toBe('Use');
    expect(validateMovement(v)).toEqual({ amount: 'validation.required' });
    expect(validateMovement({ ...v, amount: '0' })).toEqual({ amount: 'validation.positive' });
    expect(validateMovement({ ...v, amount: '250,5' })).toEqual({});
    expect(movementFormToRequest({ ...v, type: 'Return', amount: '250,5', note: ' x ' })).toEqual({
      type: 'Return',
      date: '2026-11-08',
      amount: 250.5,
      note: 'x',
    });
  });
});
