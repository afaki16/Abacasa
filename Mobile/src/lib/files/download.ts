// Korumalı dosya indirme: istek apiClient ile gider (Bearer token, 401 → refresh, X-Client, dil başlığı),
// gövde önbellek klasörüne yazılır ve sistem paylaşma menüsü açılır (Dosyalar'a kaydet, Drive, e-posta…).

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { apiClient } from '@/lib/api';

import { fileNameFromDisposition } from './fileName';

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const XLSX_UTI = 'org.openxmlformats.spreadsheetml.sheet';
const DOWNLOAD_TIMEOUT_MS = 60_000;

export interface DownloadOptions {
  /** Sunucu Content-Disposition göndermezse kullanılacak ad. */
  fallbackName: string;
  /** Android paylaşma penceresinin başlığı. */
  dialogTitle?: string;
}

/**
 * Dosyayı indirir ve paylaşma menüsünü açar. Hata ApiError olarak fırlar (ağ, yetki, oturum).
 * Paylaşma kullanılamıyorsa (ör. emülatörde paylaşma hedefi yok) false döner.
 */
export async function downloadAndShare(url: string, { fallbackName, dialogTitle }: DownloadOptions): Promise<boolean> {
  const response = await apiClient.get<ArrayBuffer>(url, {
    responseType: 'arraybuffer',
    timeout: DOWNLOAD_TIMEOUT_MS,
    headers: { Accept: '*/*' },
  });

  const name = fileNameFromDisposition(response.headers['content-disposition'], fallbackName);
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(new Uint8Array(response.data));

  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(file.uri, { mimeType: XLSX_MIME, UTI: XLSX_UTI, dialogTitle });
  return true;
}
