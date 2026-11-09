// Kişi yakınlığı (serbest metin, en fazla 50) ve baş harfler — saf yardımcılar.

/** Hazır yakınlık seçenekleri (çeviri anahtarı: people.relations.<anahtar>); "Diğer" serbest metindir. */
export const RELATION_KEYS = ['self', 'spouse', 'daughter', 'son', 'mother', 'father'] as const;
export type RelationKey = (typeof RELATION_KEYS)[number];

/**
 * Kayıtlı yakınlık hazır seçeneklerden birine denk geliyorsa onun anahtarı (büyük/küçük harf ve boşluk
 * farkı yok sayılır); değilse null (serbest metin = "Diğer").
 */
export function matchRelation(
  value: string | null | undefined,
  labels: Record<RelationKey, string>,
): RelationKey | null {
  const normalized = value?.trim().toLocaleLowerCase('tr-TR');
  if (!normalized) return null;
  return RELATION_KEYS.find((k) => labels[k].toLocaleLowerCase('tr-TR') === normalized) ?? null;
}

/** "Ahmet Yılmaz" → "AY", "elif" → "E"; boşsa "?". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toLocaleUpperCase('tr-TR');
}
