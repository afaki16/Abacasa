import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';

/**
 * Bağış hedefleri ve emanetler hanenin ek modülüdür (activeTenant.modules.donationExtras).
 * Kapalıysa ekran yerine bilgi gösterilir; modülü hane yöneticisi Hane ayarlarından açar.
 */
export function RequireDonationExtras({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const enabled = useAuthStore((s) => !!s.user?.activeTenant?.modules.donationExtras);
  if (!enabled) {
    return (
      <EmptyState
        icon="extension-off"
        tone="neutral"
        title={t('donationFunds.moduleOff.title')}
        message={t('donationFunds.moduleOff.message')}
      />
    );
  }
  return <>{children}</>;
}
