import { initials, matchRelation, RELATION_KEYS, type RelationKey } from '../relations';

const labels = Object.fromEntries(
  RELATION_KEYS.map((k, i) => [k, ['Kendisi', 'Eş', 'Kızı', 'Oğlu', 'Annesi', 'Babası'][i]]),
) as Record<RelationKey, string>;

describe('kişi yardımcıları', () => {
  it('kayıtlı yakınlığı hazır seçeneğe eşler (büyük/küçük harf, boşluk)', () => {
    expect(matchRelation('Eş', labels)).toBe('spouse');
    expect(matchRelation('  kızı ', labels)).toBe('daughter');
    expect(matchRelation('Yeğeni', labels)).toBeNull();
    expect(matchRelation('', labels)).toBeNull();
    expect(matchRelation(null, labels)).toBeNull();
  });

  it('baş harfler', () => {
    expect(initials('Ahmet Yılmaz')).toBe('AY');
    expect(initials('Elif Nur Yılmaz')).toBe('EY');
    expect(initials('ilker')).toBe('İ');
    expect(initials('  ')).toBe('?');
  });
});
