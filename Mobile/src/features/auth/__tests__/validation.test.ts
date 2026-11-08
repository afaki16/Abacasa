import i18n from '@/lib/i18n';

import {
  nameSchema,
  otpSchema,
  passwordSchema,
  toNullable,
  translateMessage,
  vmsg,
  withPasswordConfirmation,
} from '../validation';

// Backend PasswordService.ValidatePasswordStrength ile birebir olmalı: ≥8, küçük, büyük, rakam.
// Şemalar mesaj olarak çeviri anahtarı taşır; metin gösterimde çevrilir (translateMessage).
describe('passwordSchema (backend kuralının aynası)', () => {
  it.each(['Mobil123', 'Abcdefg1', 'ŞifreGüçlü9'])('geçerli: %s', (value) => {
    expect(passwordSchema.safeParse(value).success).toBe(true);
  });

  it.each([
    ['Kisa1A', 'validation.password.min'],
    ['mobil1234', 'validation.password.uppercase'],
    ['MOBIL1234', 'validation.password.lowercase'],
    ['MobilSifre', 'validation.password.digit'],
  ])('geçersiz: %s (%s)', (value, key) => {
    const result = passwordSchema.safeParse(value);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(key);
  });
});

describe('withPasswordConfirmation', () => {
  const schema = withPasswordConfirmation({});

  it('eşleşmeyen tekrar alanını confirmPassword üstünde işaretler', () => {
    const result = schema.safeParse({ newPassword: 'Mobil123', confirmPassword: 'Mobil124' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['confirmPassword']);
    expect(result.error?.issues[0].message).toBe('validation.password.mismatch');
  });

  it('eşleşen şifreleri kabul eder', () => {
    expect(schema.safeParse({ newPassword: 'Mobil123', confirmPassword: 'Mobil123' }).success).toBe(true);
  });
});

describe('translateMessage', () => {
  afterEach(async () => {
    await i18n.changeLanguage('tr');
  });

  it('anahtarı etkin dilde çevirir ve dil değişimini izler', async () => {
    await i18n.changeLanguage('tr');
    expect(translateMessage('validation.password.min')).toBe('Şifre en az 8 karakter olmalı');
    await i18n.changeLanguage('en');
    expect(translateMessage('validation.password.min')).toBe('Password must be at least 8 characters');
  });

  it('parametreli mesajı çevirir', async () => {
    await i18n.changeLanguage('tr');
    expect(translateMessage(vmsg('validation.maxLength', { max: 50 }))).toBe('En fazla 50 karakter olabilir');
  });

  it('anahtar olmayan metni (backend mesajı) olduğu gibi bırakır', () => {
    expect(translateMessage('E-posta zaten kayıtlı.')).toBe('E-posta zaten kayıtlı.');
    expect(translateMessage('validation.yokBoyleBirAnahtar')).toBe('validation.yokBoyleBirAnahtar');
    expect(translateMessage(undefined)).toBeUndefined();
  });

  it('alan şemasının mesajı çevrilebilir anahtardır', async () => {
    await i18n.changeLanguage('tr');
    const result = nameSchema('firstName').safeParse('  ');
    expect(translateMessage(result.error?.issues[0].message)).toBe('Ad gerekli');
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
