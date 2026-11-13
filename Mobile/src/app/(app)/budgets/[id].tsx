import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, ConfirmDialog, Screen, StateView } from '@/components/ui';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { BudgetForm } from '@/features/budgets/components/BudgetForm';
import { BUDGET_PERMISSIONS } from '@/features/budgets/constants';
import { useBudget, useBudgetReport, useDeleteBudget, useUpdateBudget } from '@/features/budgets/hooks';
import { todayIso } from '@/lib/format/period';
import { toast } from '@/stores/toastStore';

/** Bütçe düzenle (/budgets/[id]) + sil. */
export default function EditBudgetScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('budgets.editTitle') }} />
      <RequirePermission permission={BUDGET_PERMISSIONS.READ}>
        <EditBudget />
      </RequirePermission>
    </>
  );
}

function EditBudget() {
  const { t } = useTranslation();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const budget = useBudget(id);
  const update = useUpdateBudget();
  const remove = useDeleteBudget();
  const canUpdate = useHasPermission(BUDGET_PERMISSIONS.UPDATE);
  const canDelete = useHasPermission(BUDGET_PERMISSIONS.DELETE);
  const [confirming, setConfirming] = useState(false);
  const b = budget.data;
  const report = useBudgetReport(b?.startYear ?? 0, b?.startMonth ?? 1, todayIso(), !!b && canUpdate);

  if (budget.isPending) return <StateView kind="loading" />;
  if (budget.isError || !b) {
    return (
      <StateView
        kind="error"
        message={budget.error?.message}
        actionLabel={t('common.retry')}
        onAction={() => void budget.refetch()}
      />
    );
  }
  if (!canUpdate && !canDelete) return <StateView kind="forbidden" />;

  return (
    <Screen scroll edges={['bottom']}>
      {canUpdate ? (
        <BudgetForm
          key={b.id}
          budget={b}
          defaultYear={b.startYear}
          defaultMonth={b.startMonth}
          suggestion={report.data?.suggestion}
          pending={update.isPending}
          error={update.error}
          onSubmit={(request) =>
            update.mutate(
              { ...request, id: b.id },
              {
                onSuccess: () => {
                  toast.success(t('budgets.toast.updated'));
                  router.back();
                },
              },
            )
          }
        />
      ) : null}
      {canDelete ? <Button title={t('budgets.delete')} variant="danger" onPress={() => setConfirming(true)} /> : null}
      <ConfirmDialog
        visible={confirming}
        title={t('budgets.deleteTitle')}
        message={t('budgets.deleteMessage')}
        confirmLabel={t('common.delete')}
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          remove.mutate(b.id, {
            onSuccess: () => {
              setConfirming(false);
              toast.success(t('budgets.toast.deleted'));
              router.back();
            },
            onError: (e) => {
              setConfirming(false);
              toast.error(e.message);
            },
          })
        }
      />
    </Screen>
  );
}
