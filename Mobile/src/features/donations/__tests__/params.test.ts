import { buildDonationFilterQuery } from '../params';

describe('buildDonationFilterQuery', () => {
  it('dönemi startDate/endDate olarak gönderir', () => {
    expect(
      buildDonationFilterQuery({ period: { start: '2026-11-01', end: '2026-11-30' }, kind: 'Zakat', searchTerm: ' x ' }),
    ).toEqual({ searchTerm: 'x', startDate: '2026-11-01', endDate: '2026-11-30', kind: 'Zakat', fundId: undefined });
  });

  it('boş filtrelerde hiçbir şey göndermez', () => {
    expect(buildDonationFilterQuery({ searchTerm: '' })).toEqual({
      searchTerm: undefined,
      startDate: undefined,
      endDate: undefined,
      kind: undefined,
      fundId: undefined,
    });
  });

  it('emanet filtresini korur', () => {
    expect(buildDonationFilterQuery({ fundId: 4 }).fundId).toBe(4);
  });
});
