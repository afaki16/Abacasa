import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui';
import { TabScreen } from '@/features/shell/TabScreen';

/** Harcamalar sekmesi. Geçici: liste ekranı sonra gelecek. */
export default function ExpensesScreen() {
  const { t } = useTranslation();
  return (
    <TabScreen>
      <EmptyState icon="receipt-long" title={t('tabs.expenses')} message={t('shell.placeholderMessage')} />
    </TabScreen>
  );
}
