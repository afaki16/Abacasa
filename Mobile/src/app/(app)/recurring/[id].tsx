import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, ConfirmDialog, Screen, StateView } from '@/components/ui';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { PlanForm } from '@/features/recurringPayments/components/PlanForm';
import { RECURRING_PAYMENT_PERMISSIONS } from '@/features/recurringPayments/constants';
import {
  useDeleteRecurringPayment,
  useRecurringPayment,
  useUpdateRecurringPayment,
} from '@/features/recurringPayments/hooks';
import { toast } from '@/stores/toastStore';

/** Plan düzenle (/recurring/[id]): form + pasif yapma + sil (ödemesi olan plan silinemez, 409). */
export default function EditRecurringPaymentScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('recurring.form.editTitle') }} />
      <RequirePermission permission={RECURRING_PAYMENT_PERMISSIONS.UPDATE}>
        <EditPlan />
      </RequirePermission>
    </>
  );
}

function EditPlan() {
  const { t } = useTranslation();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const plan = useRecurringPayment(id);
  const update = useUpdateRecurringPayment();
  const remove = useDeleteRecurringPayment();
  const canDelete = useHasPermission(RECURRING_PAYMENT_PERMISSIONS.DELETE);
  const [confirming, setConfirming] = useState(false);

  if (plan.isPending) return <StateView kind="loading" />;
  if (plan.isError || !plan.data) {
    return (
      <StateView
        kind="error"
        message={plan.error?.message}
        actionLabel={t('common.retry')}
        onAction={() => void plan.refetch()}
      />
    );
  }
  const p = plan.data;

  return (
    <Screen scroll edges={['bottom']}>
      {/* Kayıt değişince (arka planda tazelenince) form yeni değerlerle kurulsun. */}
      <PlanForm
        key={`${p.id}-${p.hasPayments}`}
        plan={p}
        pending={update.isPending}
        error={update.error}
        submitLabel={t('common.save')}
        onSubmit={(request, isActive) =>
          update.mutate(
            { ...request, id: p.id, isActive },
            {
              onSuccess: () => {
                toast.success(t('recurring.toast.updated'));
                router.back();
              },
            },
          )
        }
      />
      {canDelete ? (
        <Button
          title={t('recurring.form.delete')}
          variant="danger"
          onPress={() => setConfirming(true)}
        />
      ) : null}
      <ConfirmDialog
        visible={confirming}
        title={t('recurring.delete.title')}
        message={t(
          p.hasPayments ? 'recurring.delete.messageHasPayments' : 'recurring.delete.message',
          { name: p.name },
        )}
        confirmLabel={t('common.delete')}
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          remove.mutate(p.id, {
            onSuccess: () => {
              setConfirming(false);
              toast.success(t('recurring.toast.deleted'));
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
