// Kayıt formu şeması ve form → istek dönüşümü. Davetle kayıtta (inviteToken) hane adı istenmez
// (RegisterCommandValidator: davetsiz kayıtta zorunlu, davetlide yok sayılır) ve hane açılmaz.

import { z } from 'zod';

import type { RegisterRequest } from './types';
import { emailSchema, nameSchema, passwordSchema } from './validation';

export function makeRegisterSchema(hasInvite: boolean) {
  return z
    .object({
      firstName: nameSchema('firstName'),
      lastName: nameSchema('lastName'),
      email: emailSchema,
      password: passwordSchema,
      confirmPassword: z.string(),
      householdName: hasInvite
        ? z.string()
        : z.string().trim().min(1, 'validation.householdName.required').max(100, 'validation.householdName.max'),
      // Backend de zorunlu tutar; onaylar ConsentRecord'a yazılır.
      acceptTerms: z.boolean().refine((v) => v, 'validation.acceptTerms'),
      acknowledgePrivacy: z.boolean().refine((v) => v, 'validation.acknowledgePrivacy'),
    })
    .refine((v) => v.password === v.confirmPassword, {
      path: ['confirmPassword'],
      message: 'validation.password.mismatch',
    });
}

export type RegisterFormValues = z.infer<ReturnType<typeof makeRegisterSchema>>;

/**
 * Backend RegisterRequestDto'da InviteToken var; mobil RegisterRequest tipinde henüz yok.
 * authApi.register isteği olduğu gibi (spread) gönderdiği için alan backend'e ulaşır.
 */
export type RegisterRequestWithInvite = RegisterRequest & { inviteToken?: string };

export function toRegisterRequest(values: RegisterFormValues, inviteToken?: string | null): RegisterRequestWithInvite {
  const request: RegisterRequestWithInvite = {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    password: values.password,
    confirmPassword: values.confirmPassword,
    // Tasarımda telefon yok (isteğe bağlı alan; profilden eklenebilir).
    phoneNumber: null,
    householdName: inviteToken ? '' : values.householdName.trim(),
    acceptTerms: values.acceptTerms,
    acknowledgePrivacy: values.acknowledgePrivacy,
  };
  if (inviteToken) request.inviteToken = inviteToken;
  return request;
}
