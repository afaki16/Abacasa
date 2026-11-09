import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { PlanForm } from '@/features/recurringPayments/components/PlanForm';
import { RECURRING_PAYMENT_PERMISSIONS } from '@/features/recurringPayments/constants';
import { useCreateRecurringPayment } from '@/features/recurringPayments/hooks';
import { toast } from '@/stores/toastStore';

/** Plan ekle (/recurring/new). */
export default function NewRecurringPaymentScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('recurring.form.newTitle') }} />
      <RequirePermission permission={RECURRING_PAYMENT_PERMISSIONS.CREATE}>
        <NewPlan />
      </RequirePermission>
    </>
  );
}

function NewPlan() {
  const { t } = useTranslation();
  const create = useCreateRecurringPayment();
  return (
    <Screen scroll edges={['bottom']}>
      <PlanForm
        pending={create.isPending}
        error={create.error}
        submitLabel={t('recurring.form.save')}
        onSubmit={(request) =>
          create.mutate(request, {
            onSuccess: () => {
              toast.success(t('recurring.toast.created'));
              router.back();
            },
          })
        }
      />
    </Screen>
  );
}
