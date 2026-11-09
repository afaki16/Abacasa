import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { PaymentMethodForm } from '@/features/paymentMethods/components/PaymentMethodForm';
import { PAYMENT_METHOD_PERMISSIONS } from '@/features/paymentMethods/constants';
import { toPaymentMethodRequest } from '@/features/paymentMethods/display';
import { useCreatePaymentMethod } from '@/features/paymentMethods/hooks';
import { toast } from '@/stores/toastStore';

export default function NewPaymentMethodScreen() {
  return (
    <RequirePermission permission={PAYMENT_METHOD_PERMISSIONS.CREATE}>
      <NewPaymentMethod />
    </RequirePermission>
  );
}

function NewPaymentMethod() {
  const { t } = useTranslation();
  const create = useCreatePaymentMethod();
  return (
    <Screen scroll edges={['bottom']}>
      <Stack.Screen options={{ title: t('paymentMethods.newTitle') }} />
      <PaymentMethodForm
        pending={create.isPending}
        error={create.error}
        onSubmit={(values) =>
          create.mutate(toPaymentMethodRequest(values), {
            onSuccess: () => {
              toast.success(t('paymentMethods.created'));
              router.back();
            },
          })
        }
      />
    </Screen>
  );
}
