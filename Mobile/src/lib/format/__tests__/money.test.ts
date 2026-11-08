import i18n from '@/lib/i18n';

import { formatAmount, formatMoney, formatNumber, formatOpenLine } from '../money';

describe('money', () => {
  afterEach(() => i18n.changeLanguage('tr'));

  it('binlik nokta, ondalık virgül (web tr-TR çıktısıyla aynı)', () => {
    expect(formatNumber(1234567.891)).toBe('1.234.567,89');
    expect(formatNumber(0)).toBe('0,00');
    expect(formatNumber(999, 0)).toBe('999');
    expect(formatNumber(-0.001)).toBe('0,00');
  });

  it('para birimi sembolü önde, eksi işareti sembolden önce', () => {
    expect(formatMoney(1234.5)).toBe('₺1.234,50');
    expect(formatMoney(250, 'USD')).toBe('$250,00');
    expect(formatMoney(-90, 'EUR')).toBe('-€90,00');
    expect(formatMoney(null)).toBe('—');
  });

  it('çeyrek altın adetle ve dile göre tekil/çoğul', async () => {
    await i18n.changeLanguage('tr');
    expect(formatAmount(3, 'QuarterGold')).toBe('3 çeyrek');
    await i18n.changeLanguage('en');
    expect(formatAmount(1, 'QuarterGold')).toBe('1 quarter');
    expect(formatAmount(1500, 'QuarterGold')).toBe('1.500 quarters');
  });

  it('açık tutar satırı', async () => {
    await i18n.changeLanguage('tr');
    expect(
      formatOpenLine(29000, [
        { currency: 'USD', open: 1700 },
        { currency: 'QuarterGold', open: 3 },
      ]),
    ).toBe('₺29.000,00 · $1.700,00 · 3 çeyrek');
  });
});
