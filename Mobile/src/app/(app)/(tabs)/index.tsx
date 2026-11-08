import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui';
import { TabScreen } from '@/features/shell/TabScreen';
import { useAuthStore } from '@/stores/authStore';

/** Özet sekmesi. Geçici: Özet ekranı (dönem toplamı, kartlar, yaklaşan ödemeler) sonra gelecek. */
export default function OverviewScreen() {
  const { t } = useTranslation();
  const hasHousehold = useAuthStore((s) => !!s.user?.activeTenant);

  return (
    <TabScreen>
      {hasHousehold ? (
        <EmptyState icon="space-dashboard" title={t('tabs.overview')} message={t('shell.placeholderMessage')} />
      ) : (
        <EmptyState
          icon="home"
          tone="neutral"
          title={t('household.noHouseholdTitle')}
          message={t('household.noHouseholdMessage')}
        />
      )}
    </TabScreen>
  );
}
