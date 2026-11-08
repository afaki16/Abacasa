import i18n from '@/lib/i18n';

import {
  addMonths,
  currentStatementPeriod,
  daysBetween,
  formatDisplayDate,
  formatShortDate,
  monthRange,
  statementPeriod,
} from '../period';

describe('period (web Frontend/utils/period.ts ile aynı kurallar)', () => {
  it('takvim ayı', () => {
    expect(monthRange(2026, 2)).toEqual({ start: '2026-02-01', end: '2026-02-28', year: 2026, month: 2 });
    expect(monthRange(2028, 2).end).toBe('2028-02-29');
  });

  it('ay kaydırma yıl sınırını aşar', () => {
    expect(addMonths(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(addMonths(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });

  it('kart dönemi kesim gününe göre; kısa aylarda ayın son günü', () => {
    expect(statementPeriod(2026, 11, 15)).toMatchObject({ start: '2026-10-16', end: '2026-11-15' });
    // 31 kesim: Şubat'ta 28'i, önceki dönem Ocak 31'inde biter
    expect(statementPeriod(2026, 2, 31)).toMatchObject({ start: '2026-02-01', end: '2026-02-28' });
    expect(statementPeriod(2026, 3, 31)).toMatchObject({ start: '2026-03-01', end: '2026-03-31' });
  });

  it('bugünü içeren kart dönemi', () => {
    expect(currentStatementPeriod('2026-11-10', 15)).toMatchObject({ year: 2026, month: 11 });
    expect(currentStatementPeriod('2026-11-20', 15)).toMatchObject({ year: 2026, month: 12, start: '2026-11-16' });
    expect(currentStatementPeriod('2026-12-20', 15)).toMatchObject({ year: 2027, month: 1 });
  });

  it('gösterim biçimleri ve gün farkı', async () => {
    expect(formatDisplayDate('2026-11-08')).toBe('08.11.2026');
    expect(formatDisplayDate('2026-11-08T21:19:00Z')).toBe('08.11.2026');
    expect(formatDisplayDate(null)).toBe('');
    expect(daysBetween('2026-11-08', '2026-11-20')).toBe(12);
    expect(daysBetween('2026-11-08', '2026-11-01')).toBe(-7);
    await i18n.changeLanguage('tr');
    expect(formatShortDate('2026-11-08')).toBe('8 Kas');
    await i18n.changeLanguage('en');
    expect(formatShortDate('2026-11-08')).toBe('8 Nov');
    await i18n.changeLanguage('tr');
  });
});
