import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, StateView } from '@/components/ui';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { DebtForm } from '@/features/debts/components/DebtForm';
import { DEBT_PERMISSIONS } from '@/features/debts/constants';
import { useDebt, useUpdateDebt } from '@/features/debts/hooks';
import { toast } from '@/stores/toastStore';

/** Borç düzenle (/debts/[id]/edit). */
export default function EditDebtScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('debts.editTitle') }} />
      <RequirePermission permission={DEBT_PERMISSIONS.UPDATE}>
        <EditDebt />
      </RequirePermission>
    </>
  );
}

function EditDebt() {
  const { t } = useTranslation();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const debt = useDebt(id);
  const update = useUpdateDebt();

  if (debt.isPending) return <StateView kind="loading" />;
  if (debt.isError || !debt.data) {
    return (
      <StateView
        kind="error"
        message={debt.error?.message}
        actionLabel={t('common.retry')}
        onAction={() => void debt.refetch()}
      />
    );
  }
  const d = debt.data;

  return (
    <Screen scroll edges={['bottom']}>
      <DebtForm
        key={`${d.id}-${d.hasPayments}`}
        debt={d}
        pending={update.isPending}
        error={update.error}
        onSubmit={(request) =>
          update.mutate(
            { ...request, id: d.id },
            {
              onSuccess: () => {
                toast.success(t('debts.toast.updated'));
                router.back();
              },
            },
          )
        }
      />
    </Screen>
  );
}
