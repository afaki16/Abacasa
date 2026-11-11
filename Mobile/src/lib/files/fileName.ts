// Content-Disposition başlığından dosya adı. Saf; testlidir.

/**
 * RFC 6266: önce filename* (UTF-8, yüzde kodlu), sonra filename. Yol ayırıcıları ve dosya sisteminde
 * geçersiz karakterler atılır; ad çıkmazsa fallback.
 */
export function fileNameFromDisposition(header: string | null | undefined, fallback: string): string {
  if (!header) return fallback;

  let name: string | null = null;
  const star = /filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/.exec(header);
  if (star) {
    try {
      name = decodeURIComponent(star[1].trim().replace(/^"|"$/g, ''));
    } catch {
      name = null;
    }
  }
  if (!name) {
    const plain = /filename\s*=\s*("([^"]*)"|[^;]+)/.exec(header);
    if (plain) name = (plain[2] ?? plain[1]).trim();
  }

  const safe = name?.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim();
  return safe ? safe : fallback;
}
