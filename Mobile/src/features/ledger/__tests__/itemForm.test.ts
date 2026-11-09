import { applyFirstToAll, changedMonths, inputsToMonths, monthsToInputs } from '../itemForm';

describe('elle kalem formu eşlemesi', () => {
  it('kayıtlı değerler alan metnine ve geri çevrilir', () => {
    const months = [52000, 52000.5, null, 0, ...Array(8).fill(null)];
    const inputs = monthsToInputs(months);
    expect(inputs.slice(0, 4)).toEqual(['52000,00', '52000,50', '', '0,00']);
    expect(inputsToMonths(inputs)).toEqual(months);
  });

  it('yalnızca değişen aylar gönderilir; boşaltılan ay null (temizle)', () => {
    const before = [100, 200, null, ...Array(9).fill(null)];
    const after = [100, 250, 50, ...Array(9).fill(null)];
    after[11] = null;
    expect(changedMonths(before, after)).toEqual([
      { month: 2, amount: 250 },
      { month: 3, amount: 50 },
    ]);
    expect(changedMonths(before, [null, 200, null, ...Array(9).fill(null)])).toEqual([
      { month: 1, amount: null },
    ]);
  });

  it('Ocak tutarını tüm aylara uygular; Ocak boşsa dokunmaz', () => {
    const inputs = ['52000', '', '1', ...Array(9).fill('')];
    expect(applyFirstToAll(inputs)).toEqual(Array(12).fill('52000'));
    const empty = ['', '5', ...Array(10).fill('')];
    expect(applyFirstToAll(empty)).toEqual(empty);
  });
});
