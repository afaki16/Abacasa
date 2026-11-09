// Profil fotoğrafı adresi ve baş harfler. Saf; testlidir.

/** Göreli adres (/uploads/...) API köküne bağlanır; tam adres olduğu gibi kalır. */
export function resolveAvatarUrl(url: string | null | undefined, apiBaseUrl: string): string | null {
  const value = url?.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${apiBaseUrl.replace(/\/+$/, '')}/${value.replace(/^\/+/, '')}`;
}

/** "Ahmet", "Yılmaz" → "AY"; boşsa "?". */
export function userInitials(firstName?: string | null, lastName?: string | null): string {
  const value = `${firstName?.trim()[0] ?? ''}${lastName?.trim()[0] ?? ''}`;
  return value ? value.toLocaleUpperCase('tr-TR') : '?';
}
