import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ErrorState, Screen, StateView } from '@/components/ui';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { DefinitionDeleteButton } from '@/features/categories/components/DefinitionList';
import { PaymentMethodForm } from '@/features/paymentMethods/components/PaymentMethodForm';
import { PAYMENT_METHOD_PERMISSIONS } from '@/features/paymentMethods/constants';
import { toPaymentMethodRequest } from '@/features/paymentMethods/display';
import {
  useDeletePaymentMethod,
  usePaymentMethod,
  useUpdatePaymentMethod,
} from '@/features/paymentMethods/hooks';
import { toast } from '@/stores/toastStore';

/** Ödeme aracı düzenle / sil. Kullanımdaki araç silinemez; pencereden doğrudan pasif yapılabilir. */
export default function EditPaymentMethodScreen() {
  return (
    <RequirePermission permission={PAYMENT_METHOD_PERMISSIONS.READ}>
      <EditPaymentMethod />
    </RequirePermission>
  );
}

function EditPaymentMethod() {
  const { t } = useTranslation();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const method = usePaymentMethod(id);
  const update = useUpdatePaymentMethod();
  const remove = useDeletePaymentMethod();
  const canUpdate = useHasPermission(PAYMENT_METHOD_PERMISSIONS.UPDATE);
  const canDelete = useHasPermission(PAYMENT_METHOD_PERMISSIONS.DELETE);

  if (method.isPending) return <StateView kind="loading" />;
  if (method.isError || !method.data) {
    return (
      <ErrorState
        title={t('common.error')}
        message={method.error?.message}
        actionLabel={t('common.retry')}
        onAction={() => void method.refetch()}
      />
    );
  }
  const m = method.data;

  const deactivate = () =>
    update.mutate(
      {
        id,
        name: m.name,
        type: m.type,
        bank: m.bank,
        ownerPersonId: m.ownerPersonId,
        statementDay: m.statementDay,
        isActive: false,
      },
      {
        onSuccess: () => {
          toast.success(t('paymentMethods.deactivated'));
          router.back();
        },
        onError: (e) => toast.error(e.message),
      },
    );

  return (
    <Screen scroll edges={['bottom']}>
      <Stack.Screen options={{ title: canUpdate ? t('paymentMethods.editTitle') : m.name }} />
      {canUpdate ? (
        <PaymentMethodForm
          method={m}
          pending={update.isPending}
          error={update.error}
          onSubmit={(values) =>
            update.mutate(
              { id, ...toPaymentMethodRequest(values) },
              {
                onSuccess: () => {
                  toast.success(t('paymentMethods.saved'));
                  router.back();
                },
              },
            )
          }
        />
      ) : null}
      {canDelete ? (
        <DefinitionDeleteButton
          label={t('paymentMethods.delete')}
          confirmTitle={t('paymentMethods.deleteTitle')}
          confirmMessage={t('paymentMethods.deleteMessage', { name: m.name })}
          inUseTitle={t('paymentMethods.inUseTitle', { name: m.name })}
          pending={remove.isPending}
          onDelete={(handlers) => remove.mutate(id, handlers)}
          onDeleted={() => {
            toast.success(t('paymentMethods.deleted'));
            router.back();
          }}
          secondaryLabel={canUpdate && m.isActive ? t('paymentMethods.makePassive') : undefined}
          onSecondary={canUpdate && m.isActive ? deactivate : undefined}
          secondaryLoading={update.isPending}
        />
      ) : null}
    </Screen>
  );
}
