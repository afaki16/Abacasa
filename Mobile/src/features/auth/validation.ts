// Form şemaları — backend kurallarının aynası. Asıl doğrulama backend'dedir; bunlar
// kullanıcıya istek atmadan anında geri bildirim vermek içindir.

import { z } from 'zod';

/** PasswordService.ValidatePasswordStrength: ≥8, küçük harf, büyük harf, rakam. */
export const passwordSchema = z
  .string()
  .min(8, 'Şifre en az 8 karakter olmalı')
  .max(100, 'Şifre en fazla 100 karakter olabilir')
  .regex(/[a-z]/, 'Şifre en az bir küçük harf içermeli')
  .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermeli')
  .regex(/\d/, 'Şifre en az bir rakam içermeli');

export const PASSWORD_HINT = 'En az 8 karakter; büyük harf, küçük harf ve rakam içermeli.';

export const emailSchema = z.email('Geçerli bir e-posta gir').max(100, 'E-posta en fazla 100 karakter olabilir');

/** RegisterCommandValidator / UpdateProfileCommandValidator: zorunlu, ≤50. */
export const nameSchema = (label: string) =>
  z.string().trim().min(1, `${label} gerekli`).max(50, `${label} en fazla 50 karakter olabilir`);

/** Opsiyonel; boş bırakılırsa null gönderilir. Biçimi backend normalize eder. */
export const phoneSchema = z.string().trim().max(20, 'Telefon en fazla 20 karakter olabilir');

/** OtpService: 6 haneli kod. */
export const otpSchema = z.string().regex(/^\d{6}$/, '6 haneli kodu gir');

/** Yeni şifre + tekrar alanı olan formlar için. */
type PasswordPair = { newPassword: string; confirmPassword: string };

export function withPasswordConfirmation<T extends z.ZodRawShape>(shape: T) {
  return z
    .object({ ...shape, newPassword: passwordSchema, confirmPassword: z.string() })
    // Jenerik shape'te zod alan tiplerini çıkaramıyor; iki alan her zaman var.
    .refine((v) => (v as PasswordPair).newPassword === (v as PasswordPair).confirmPassword, {
      path: ['confirmPassword'],
      message: 'Şifreler eşleşmiyor',
    });
}

export const toNullable = (value: string | undefined) => (value?.trim() ? value.trim() : null);
