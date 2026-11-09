import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { DebtForm } from '@/features/debts/components/DebtForm';
import { DEBT_PERMISSIONS } from '@/features/debts/constants';
import { useCreateDebt } from '@/features/debts/hooks';
import { toast } from '@/stores/toastStore';

/** Borç ekle (/debts/new). */
export default function NewDebtScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('debts.newTitle') }} />
      <RequirePermission permission={DEBT_PERMISSIONS.CREATE}>
        <NewDebt />
      </RequirePermission>
    </>
  );
}

function NewDebt() {
  const { t } = useTranslation();
  const create = useCreateDebt();
  return (
    <Screen scroll edges={['bottom']}>
      <DebtForm
        pending={create.isPending}
        error={create.error}
        onSubmit={(request) =>
          create.mutate(request, {
            onSuccess: () => {
              toast.success(t('debts.toast.created'));
              router.back();
            },
          })
        }
      />
    </Screen>
  );
}
