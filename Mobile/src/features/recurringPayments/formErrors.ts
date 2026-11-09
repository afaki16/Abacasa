// Sunucu doğrulama hatalarını form alanlarına dağıtır (saf fonksiyon). Planlama formlarında ortak.
// Backend anahtarları PascalCase ya da yol olabilir ("Amount", "request.amount"); büyük/küçük harf ve
// yol öneki yok sayılır. Eşleşmeyen mesajlar form üstündeki FormError'a gider.

import type { ApiError } from '@/lib/api';

export interface SplitFieldErrors<F extends string> {
  /** Alan adı → ilk mesaj. */
  fields: Partial<Record<F, string>>;
  /** Hiçbir alana düşmeyen mesajlar (ya da alan hatası yoksa genel mesaj). */
  rest: string[];
}

const normalizeKey = (key: string) => {
  const last = key.split('.').pop() ?? key;
  return last.replace(/\[\d+\]$/, '').toLowerCase();
};

/**
 * aliases: backend alan adı formdaki addan farklıysa (ör. { paymentMethodId: 'paymentMethod' }).
 */
export function splitFieldErrors<F extends string>(
  error: Pick<ApiError, 'fieldErrors' | 'message'> | null | undefined,
  formFields: readonly F[],
  aliases: Partial<Record<string, F>> = {},
): SplitFieldErrors<F> {
  const result: SplitFieldErrors<F> = { fields: {}, rest: [] };
  if (!error) return result;

  const byKey = new Map<string, F>();
  for (const f of formFields) byKey.set(f.toLowerCase(), f);
  for (const [k, f] of Object.entries(aliases)) if (f) byKey.set(k.toLowerCase(), f);

  const entries = Object.entries(error.fieldErrors ?? {});
  for (const [key, messages] of entries) {
    const first = messages.find(Boolean);
    if (!first) continue;
    const field = byKey.get(normalizeKey(key));
    if (field && result.fields[field] === undefined) result.fields[field] = first;
    else if (!field) result.rest.push(...messages.filter(Boolean));
  }
  if (entries.length === 0 && error.message) result.rest.push(error.message);
  return result;
}
