import { resolveAvatarUrl, userInitials } from '../avatar';
import { passwordRuleStates } from '../passwordRules';
import { mapFieldErrors } from '../serverErrors';

describe('passwordRuleStates', () => {
  it('her kural ayrı değerlendirilir', () => {
    expect(passwordRuleStates('abc1')).toEqual([
      { key: 'min', ok: false },
      { key: 'uppercase', ok: false },
      { key: 'lowercase', ok: true },
      { key: 'digit', ok: true },
    ]);
    expect(passwordRuleStates('Abcdefg1').every((r) => r.ok)).toBe(true);
  });
});

describe('mapFieldErrors', () => {
  it('alanlar büyük/küçük harf duyarsız eşlenir, kalanlar banda', () => {
    const result = mapFieldErrors(
      { NewEmail: ['Bu e-posta kullanımda'], 'request.currentPassword': ['Şifre hatalı', 'x'], Other: ['Genel hata'], Empty: [] },
      { newEmail: 'newEmail' as const, CurrentPassword: 'currentPassword' as const },
    );
    expect(result.fields).toEqual([
      { name: 'newEmail', message: 'Bu e-posta kullanımda' },
      { name: 'currentPassword', message: 'Şifre hatalı' },
    ]);
    expect(result.rest).toEqual(['Genel hata']);
  });
});

describe('avatar', () => {
  it('göreli adres API köküne bağlanır, tam adres korunur, boş → null', () => {
    expect(resolveAvatarUrl('/uploads/a.webp', 'http://api:5166/')).toBe('http://api:5166/uploads/a.webp');
    expect(resolveAvatarUrl('https://cdn.ornek.com/a.webp', 'http://api')).toBe('https://cdn.ornek.com/a.webp');
    expect(resolveAvatarUrl('  ', 'http://api')).toBeNull();
    expect(resolveAvatarUrl(null, 'http://api')).toBeNull();
  });

  it('baş harfler (Türkçe büyük harf)', () => {
    expect(userInitials('ilker', 'yılmaz')).toBe('İY');
    expect(userInitials('', '')).toBe('?');
    expect(userInitials('Ahmet', null)).toBe('A');
  });
});
