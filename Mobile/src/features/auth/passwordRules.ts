// Canlı şifre kuralları (kayıt, şifre sıfırlama, şifre değiştirme). validation.ts'teki passwordSchema ile
// aynı kurallar — o da backend PasswordService.ValidatePasswordStrength'in aynası (≥8, küçük, büyük, rakam).
// Backend özel karakter istemediği için bu listede yok.

export type PasswordRuleKey = 'min' | 'upper' | 'lower' | 'digit';

export interface PasswordRuleResult {
  key: PasswordRuleKey;
  /** Çeviri anahtarı (authScreens.passwordRules.*). */
  labelKey: string;
  met: boolean;
}

const RULES: { key: PasswordRuleKey; test: (password: string) => boolean }[] = [
  { key: 'min', test: (p) => p.length >= 8 },
  { key: 'upper', test: (p) => /[A-Z]/.test(p) },
  { key: 'lower', test: (p) => /[a-z]/.test(p) },
  { key: 'digit', test: (p) => /\d/.test(p) },
];

export function evaluatePasswordRules(password: string | null | undefined): PasswordRuleResult[] {
  const value = password ?? '';
  return RULES.map(({ key, test }) => ({ key, labelKey: `authScreens.passwordRules.${key}`, met: test(value) }));
}

/** Tekrar gönder sayacı: 42 → "0:42", 60 → "1:00". */
export function formatCountdown(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
}

/** OTP alanı: yalnızca rakam, en fazla 6 hane (yapıştırılan "123 456" da kabul edilir). */
export function sanitizeOtp(input: string): string {
  return input.replace(/\D/g, '').slice(0, 6);
}

/**
 * Metnin içine öğe yerleştirmek için (bağlantı, kalın e-posta): çeviri "{{link}}’nı okudum…" gibi
 * tek yer tutucu içerir; t(key, { link: INLINE_MARKER }) sonucu buradan iki parçaya bölünür.
 * (Boş çeviri değeri i18next'te anahtar olarak döndüğü için önce/sonra anahtarları kullanılmaz.)
 */
export const INLINE_MARKER = String.fromCharCode(0x2063); // görünmez ayırıcı (U+2063)

export function splitAroundMarker(text: string): [string, string] {
  const index = text.indexOf(INLINE_MARKER);
  if (index === -1) return [text, ''];
  return [text.slice(0, index), text.slice(index + INLINE_MARKER.length)];
}
