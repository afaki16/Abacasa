// Form şemaları — backend kurallarının aynası. Asıl doğrulama backend'dedir; bunlar
// kullanıcıya istek atmadan anında geri bildirim vermek içindir.
//
// Mesajlar metin değil ÇEVİRİ ANAHTARIDIR (şemalar modül yüklenirken bir kez kurulur; dil sonradan
// değişebilir). Gösterimde çevrilir: TextField, OptionCards ve FormError gelen mesajı
// translateMessage() ile çevirir. Parametreli mesaj: vmsg('validation.maxLength', { max: 50 }).

import { z } from 'zod';

import i18n, { t } from '@/lib/i18n';

const PARAM_SEPARATOR = '|';
const KEY_PATTERN = /^[A-Za-z0-9_.]+$/;

/** Doğrulama mesajı: çeviri anahtarı (+ parametreler). zod mesajı string olduğu için tek metne gömülür. */
export function vmsg(key: string, params?: Record<string, string | number>): string {
  return params ? `${key}${PARAM_SEPARATOR}${JSON.stringify(params)}` : key;
}

/**
 * Gösterim anında çeviri. Anahtar değilse (ör. backend'in yerelleştirilmiş mesajı) olduğu gibi döner.
 * Dil değişince yeniden çizilmesi için çağıran bileşen useTranslation() kullanmalıdır.
 */
export function translateMessage(message: string): string;
export function translateMessage(message: string | undefined): string | undefined;
export function translateMessage(message: string | undefined): string | undefined {
  if (!message) return message;
  const separator = message.indexOf(PARAM_SEPARATOR);
  const key = separator === -1 ? message : message.slice(0, separator);
  if (!KEY_PATTERN.test(key) || !i18n.exists(key)) return message;
  let params: Record<string, unknown> | undefined;
  if (separator !== -1) {
    try {
      params = JSON.parse(message.slice(separator + 1)) as Record<string, unknown>;
    } catch {
      params = undefined;
    }
  }
  return t(key, params ?? {});
}

/** PasswordService.ValidatePasswordStrength: ≥8, küçük harf, büyük harf, rakam. */
export const passwordSchema = z
  .string()
  .min(8, 'validation.password.min')
  .max(100, 'validation.password.max')
  .regex(/[a-z]/, 'validation.password.lowercase')
  .regex(/[A-Z]/, 'validation.password.uppercase')
  .regex(/\d/, 'validation.password.digit');

/** Şifre kuralının açıklaması (alan ipucu); t(PASSWORD_HINT_KEY) ile gösterilir. */
export const PASSWORD_HINT_KEY = 'validation.password.hint';

export const emailSchema = z.email('validation.email.invalid').max(100, 'validation.email.max');

/** RegisterCommandValidator / UpdateProfileCommandValidator: zorunlu, ≤50. */
export const nameSchema = (field: 'firstName' | 'lastName') =>
  z.string().trim().min(1, `validation.${field}.required`).max(50, `validation.${field}.max`);

/** Opsiyonel; boş bırakılırsa null gönderilir. Biçimi backend normalize eder. */
export const phoneSchema = z.string().trim().max(20, 'validation.phone.max');

/** OtpService: 6 haneli kod. */
export const otpSchema = z.string().regex(/^\d{6}$/, 'validation.otp');

/** Yeni şifre + tekrar alanı olan formlar için. */
type PasswordPair = { newPassword: string; confirmPassword: string };

export function withPasswordConfirmation<T extends z.ZodRawShape>(shape: T) {
  return z
    .object({ ...shape, newPassword: passwordSchema, confirmPassword: z.string() })
    // Jenerik shape'te zod alan tiplerini çıkaramıyor; iki alan her zaman var.
    .refine((v) => (v as PasswordPair).newPassword === (v as PasswordPair).confirmPassword, {
      path: ['confirmPassword'],
      message: 'validation.password.mismatch',
    });
}

export const toNullable = (value: string | undefined) => (value?.trim() ? value.trim() : null);
