import { otpSchema, passwordSchema, toNullable, withPasswordConfirmation } from '../validation';

// Backend PasswordService.ValidatePasswordStrength ile birebir olmalı: ≥8, küçük, büyük, rakam.
describe('passwordSchema (backend kuralının aynası)', () => {
  it.each(['Mobil123', 'Abcdefg1', 'ŞifreGüçlü9'])('geçerli: %s', (value) => {
    expect(passwordSchema.safeParse(value).success).toBe(true);
  });

  it.each([
    ['Kisa1A', 'en az 8'],
    ['mobil1234', 'büyük harf'],
    ['MOBIL1234', 'küçük harf'],
    ['MobilSifre', 'rakam'],
  ])('geçersiz: %s (%s)', (value, reason) => {
    const result = passwordSchema.safeParse(value);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain(reason);
  });
});

describe('withPasswordConfirmation', () => {
  const schema = withPasswordConfirmation({});

  it('eşleşmeyen tekrar alanını confirmPassword üstünde işaretler', () => {
    const result = schema.safeParse({ newPassword: 'Mobil123', confirmPassword: 'Mobil124' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['confirmPassword']);
  });

  it('eşleşen şifreleri kabul eder', () => {
    expect(schema.safeParse({ newPassword: 'Mobil123', confirmPassword: 'Mobil123' }).success).toBe(true);
  });
});

describe('yardımcılar', () => {
  it('otpSchema yalnızca 6 haneyi kabul eder', () => {
    expect(otpSchema.safeParse('123456').success).toBe(true);
    expect(otpSchema.safeParse('12345').success).toBe(false);
    expect(otpSchema.safeParse('12345a').success).toBe(false);
  });

  it('toNullable boş metni null yapar', () => {
    expect(toNullable('  ')).toBeNull();
    expect(toNullable(undefined)).toBeNull();
    expect(toNullable(' 0555 ')).toBe('0555');
  });
});
