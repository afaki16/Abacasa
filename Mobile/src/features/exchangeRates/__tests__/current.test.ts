import { buildRateCards, formatRate, parseRateInput, sanitizeRateInput } from '../current';
import type { ExchangeRate } from '../types';

const manual: ExchangeRate[] = [
  { id: 1, currency: 'EUR', rate: 48.71, date: '2026-11-08', createdDate: '' },
  { id: 2, currency: 'EUR', rate: 48.1, date: '2026-11-01', createdDate: '' },
  { id: 3, currency: 'QuarterGold', rate: 4250, date: '2026-10-20', createdDate: '' },
];

describe('buildRateCards', () => {
  it('özetteki güncel kurları kullanır; elle güncel kurun kaydını bulur', () => {
    const cards = buildRateCards(
      [
        { currency: 'USD', rate: 41.852, date: '2026-11-07', source: 'TCMB' },
        { currency: 'EUR', rate: 48.71, date: '2026-11-08', source: 'Elle' },
      ],
      manual,
    );
    expect(cards.map((c) => c.currency)).toEqual(['USD', 'EUR', 'QuarterGold']);
    expect(cards[0]).toMatchObject({ rate: 41.852, source: 'TCMB', manualId: null });
    expect(cards[1]).toMatchObject({ rate: 48.71, source: 'Elle', manualId: 1 });
    // Özette çeyrek kuru yoksa "kur yok".
    expect(cards[2]).toMatchObject({ rate: null, source: null, manualId: null });
  });

  it('özet yoksa (izin yok) elle girilen son kur gösterilir', () => {
    const cards = buildRateCards(undefined, manual);
    expect(cards[0]).toMatchObject({ rate: null, source: null });
    expect(cards[1]).toMatchObject({
      rate: 48.71,
      date: '2026-11-08',
      source: 'Elle',
      manualId: 1,
    });
    expect(cards[2]).toMatchObject({ rate: 4250, source: 'Elle', manualId: 3 });
  });
});

describe('kur girişi', () => {
  it('nokta virgül sayılır, en fazla 4 ondalık, baştaki sıfırlar atılır', () => {
    expect(sanitizeRateInput('41.85205')).toBe('41,8520');
    expect(sanitizeRateInput('0041,5')).toBe('41,5');
    expect(sanitizeRateInput(',5')).toBe('0,5');
    expect(sanitizeRateInput('4250')).toBe('4250');
    expect(sanitizeRateInput('1,2,3')).toBe('1,23');
  });

  it('ayrıştırma ve gösterim', () => {
    expect(parseRateInput('41,852')).toBe(41.852);
    expect(parseRateInput('')).toBeNull();
    expect(formatRate(41.852, 'USD')).toBe('₺41,8520');
    expect(formatRate(4250, 'QuarterGold')).toBe('₺4.250,00');
    expect(formatRate(null, 'EUR')).toBe('—');
  });
});
