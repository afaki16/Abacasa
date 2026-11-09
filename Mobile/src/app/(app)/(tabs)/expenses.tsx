import { useTranslation } from 'react-i18next';

import { EmptyState, StateView } from '@/components/ui';
import { useHasPermission } from '@/features/auth/permissions';
import { ExpenseList } from '@/features/expenses/components/ExpenseList';
import { EXPENSE_PERMISSIONS } from '@/features/expenses/constants';
import { TabScreen } from '@/features/shell/TabScreen';
import { useAuthStore } from '@/stores/authStore';

/** Harcamalar sekmesi (Expenses.Read). */
export default function ExpensesScreen() {
  const { t } = useTranslation();
  const hasHousehold = useAuthStore((s) => !!s.user?.activeTenant);
  const isUserVerified = useAuthStore((s) => s.isUserVerified);
  const canRead = useHasPermission(EXPENSE_PERMISSIONS.READ);

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

  return (
    <TabScreen scroll={false}>
      {!isUserVerified ? <StateView kind="loading" /> : canRead ? <ExpenseList /> : <StateView kind="forbidden" />}
    </TabScreen>
  );
}
