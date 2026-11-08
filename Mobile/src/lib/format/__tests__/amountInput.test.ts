import {
  amountToInput,
  formatAmountInput,
  groupAmountInput,
  nextAmountInput,
  parseAmountInput,
  sanitizeAmountInput,
} from '../amountInput';

describe('amountInput', () => {
  it('ham değeri temizler: tek virgül, en fazla 2 ondalık, baştaki sıfırlar', () => {
    expect(sanitizeAmountInput('0012,345', 'TRY')).toBe('12,34');
    expect(sanitizeAmountInput('1,2,3', 'TRY')).toBe('1,23');
    expect(sanitizeAmountInput(',5', 'USD')).toBe('0,5');
    expect(sanitizeAmountInput('abc', 'TRY')).toBe('');
    expect(sanitizeAmountInput('0', 'TRY')).toBe('0');
  });

  it('çeyrek altında yalnızca tam sayı kabul eder', () => {
    expect(sanitizeAmountInput('3,5', 'QuarterGold')).toBe('3');
    expect(nextAmountInput('3', '3.', 'QuarterGold')).toBe('3');
  });

  it('sayıya çevirir', () => {
    expect(parseAmountInput('1234,5')).toBe(1234.5);
    expect(parseAmountInput('0,05')).toBe(0.05);
    expect(parseAmountInput('')).toBeNull();
    expect(parseAmountInput(',')).toBeNull();
  });

  it('yazarken tr-TR biçiminde gruplar ve sembol ekler', () => {
    expect(groupAmountInput('1234567,5')).toBe('1.234.567,5');
    expect(formatAmountInput('245,90', 'TRY')).toBe('₺245,90');
    expect(formatAmountInput('250', 'USD')).toBe('$250');
    expect(formatAmountInput('3', 'QuarterGold')).toBe('3');
    expect(formatAmountInput('', 'TRY')).toBe('');
  });

  it('alana yazılan karakteri işler; "." ondalık sayılır', () => {
    expect(nextAmountInput('123', '₺1236', 'TRY')).toBe('1236');
    expect(nextAmountInput('1234', '₺1.234.', 'TRY')).toBe('1234,');
    expect(nextAmountInput('1234,', '₺1.234,5', 'TRY')).toBe('1234,5');
    expect(nextAmountInput('1234,56', '₺1.234,567', 'TRY')).toBe('1234,56');
  });

  it('silmede gruplama noktalarını atar; yapıştırılan "12.50" ondalıktır', () => {
    expect(nextAmountInput('1234', '₺1.23', 'TRY')).toBe('123');
    expect(nextAmountInput('1234,5', '₺1.234,', 'TRY')).toBe('1234,');
    expect(nextAmountInput('', '12.50', 'EUR')).toBe('12,50');
    expect(nextAmountInput('', '1.234', 'TRY')).toBe('1234');
  });

  it('kayıtlı değeri düzenleme metnine çevirir', () => {
    expect(amountToInput(1234.5, 'TRY')).toBe('1234,50');
    expect(amountToInput(3, 'QuarterGold')).toBe('3');
    expect(amountToInput(null, 'TRY')).toBe('');
  });
});
