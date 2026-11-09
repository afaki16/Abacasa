import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui';
import { useHasPermission } from '@/features/auth/permissions';
import { Overview } from '@/features/dashboard/components/Overview';
import { DASHBOARD_PERMISSIONS } from '@/features/dashboard/constants';
import { go, ROUTES } from '@/features/dashboard/links';
import { EXPENSE_PERMISSIONS } from '@/features/expenses/constants';
import { TabScreen } from '@/features/shell/TabScreen';
import { useAuthStore } from '@/stores/authStore';

/**
 * Özet sekmesi. Hanesiz kullanıcıda hane boş durumu; Dashboard.Read yoksa API çağrılmaz, yetki bilgisi
 * (harcama ekleyebiliyorsa ekleme düğmesiyle) gösterilir.
 */
export default function OverviewScreen() {
  const { t } = useTranslation();
  const hasHousehold = useAuthStore((s) => !!s.user?.activeTenant);
  const isUserVerified = useAuthStore((s) => s.isUserVerified);
  const canRead = useHasPermission(DASHBOARD_PERMISSIONS.READ);
  const canCreateExpense = useHasPermission(EXPENSE_PERMISSIONS.CREATE);

  if (!hasHousehold) {
    return (
      <TabScreen>
        <EmptyState
          icon="home"
          tone="neutral"
          title={t('household.noHouseholdTitle')}
          message={t('household.noHouseholdMessage')}
        />
      </TabScreen>
    );
  }

  // Yetkiler /me ile gelene kadar Özet istenmez.
  if (isUserVerified && !canRead) {
    return (
      <TabScreen>
        <EmptyState
          icon="lock"
          tone="neutral"
          title={t('summary.forbidden.title')}
          message={t('summary.forbidden.message')}
          actionLabel={canCreateExpense ? t('summary.forbidden.addExpense') : undefined}
          actionIcon="add"
          onAction={() => go(ROUTES.newExpense)}
        />
      </TabScreen>
    );
  }

  return <TabScreen scroll={false}>{isUserVerified ? <Overview /> : null}</TabScreen>;
}
