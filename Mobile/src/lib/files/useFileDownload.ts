import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { isApiError, type ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';

import { downloadAndShare, type DownloadOptions } from './download';

export interface FileDownloadRequest extends DownloadOptions {
  /** apiClient baseURL'üne göre yol (ör. /api/Household/export). */
  url: string;
}

/**
 * Excel indirme düğmeleri için: indirir, paylaşma menüsünü açar; hata ve "paylaşma yok" durumunu toast'la bildirir.
 * İkili gövdede sunucu mesajı okunamaz; ağ hatası dışındaki hatalar tek genel mesajla gösterilir.
 */
export function useFileDownload() {
  const { t } = useTranslation();
  return useMutation<boolean, ApiError, FileDownloadRequest>({
    mutationFn: ({ url, ...options }) => downloadAndShare(url, options),
    onSuccess: (shared) => {
      if (!shared) toast.error(t('files.shareUnavailable'));
    },
    onError: (error) => {
      const offline = isApiError(error) && error.status === 0;
      toast.error(offline ? t('files.offline') : t('files.downloadFailed'));
    },
  });
}
