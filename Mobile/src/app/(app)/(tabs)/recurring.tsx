import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui';
import { TabScreen } from '@/features/shell/TabScreen';

/** Sabit ödemeler sekmesi. Geçici: liste ekranı sonra gelecek. */
export default function RecurringPaymentsScreen() {
  const { t } = useTranslation();
  return (
    <TabScreen>
      <EmptyState icon="event-repeat" title={t('tabs.recurring')} message={t('shell.placeholderMessage')} />
    </TabScreen>
  );
}
