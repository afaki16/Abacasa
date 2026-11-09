// Şifre kurallarının canlı listesi (Şifre değiştir ekranı). Kurallar features/auth/validation.ts'teki
// passwordSchema'nın aynası (backend PasswordService: ≥8, büyük harf, küçük harf, rakam). Saf; testlidir.

export type PasswordRuleKey = 'min' | 'uppercase' | 'lowercase' | 'digit';

const RULES: { key: PasswordRuleKey; test: (password: string) => boolean }[] = [
  { key: 'min', test: (p) => p.length >= 8 },
  { key: 'uppercase', test: (p) => /[A-Z]/.test(p) },
  { key: 'lowercase', test: (p) => /[a-z]/.test(p) },
  { key: 'digit', test: (p) => /\d/.test(p) },
];

export function passwordRuleStates(password: string): { key: PasswordRuleKey; ok: boolean }[] {
  return RULES.map((r) => ({ key: r.key, ok: r.test(password) }));
}
