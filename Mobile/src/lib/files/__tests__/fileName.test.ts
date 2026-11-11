import { fileNameFromDisposition } from '../fileName';

describe('fileNameFromDisposition', () => {
  it('başlık yoksa fallback', () => {
    expect(fileNameFromDisposition(undefined, 'veri.xlsx')).toBe('veri.xlsx');
    expect(fileNameFromDisposition('attachment', 'veri.xlsx')).toBe('veri.xlsx');
  });

  it('filename* (UTF-8) filename\'e göre önceliklidir', () => {
    const header = "attachment; filename=Hane_2026.xlsx; filename*=UTF-8''Hane%C3%A7%C4%B1k_2026.xlsx";
    expect(fileNameFromDisposition(header, 'x.xlsx')).toBe('Haneçık_2026.xlsx');
  });

  it('tırnaklı ve tırnaksız filename', () => {
    expect(fileNameFromDisposition('attachment; filename="abacasa veri.xlsx"', 'x')).toBe('abacasa veri.xlsx');
    expect(fileNameFromDisposition('attachment; filename=abacasa.xlsx', 'x')).toBe('abacasa.xlsx');
  });

  it('yol ayırıcıları ve geçersiz karakterler atılır', () => {
    expect(fileNameFromDisposition('attachment; filename="../a/b:c.xlsx"', 'x')).toBe('.._a_b_c.xlsx');
  });

  it('bozuk yüzde kodlamasında filename\'e düşer', () => {
    expect(fileNameFromDisposition("attachment; filename=a.xlsx; filename*=UTF-8''%E0%A4%A", 'x')).toBe('a.xlsx');
  });
});
