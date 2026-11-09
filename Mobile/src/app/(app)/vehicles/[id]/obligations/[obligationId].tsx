import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, ConfirmDialog, ErrorState, Screen, StateView } from '@/components/ui';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { ObligationForm } from '@/features/vehicles/components/ObligationForm';
import { VEHICLE_PERMISSIONS } from '@/features/vehicles/constants';
import {
  useDeleteVehicleObligation,
  useUpdateVehicleObligation,
  useVehicleObligations,
} from '@/features/vehicles/hooks';
import { buildObligationRequest } from '@/features/vehicles/obligations';
import { enumLabel } from '@/lib/domain/enums';
import { toast } from '@/stores/toastStore';

/**
 * Araç işlemi düzenle / sil. Bağlı canlı harcaması varsa tarih/tutar değişikliği ve silme harcamaya yansır
 * (tersi yansımaz).
 */
export default function EditObligationScreen() {
  return (
    <RequirePermission permission={VEHICLE_PERMISSIONS.UPDATE}>
      <EditObligation />
    </RequirePermission>
  );
}

function EditObligation() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id: string; obligationId: string }>();
  const vehicleId = Number(params.id);
  const obligationId = Number(params.obligationId);
  const obligations = useVehicleObligations(vehicleId);
  const update = useUpdateVehicleObligation();
  const remove = useDeleteVehicleObligation();
  const [confirm, setConfirm] = useState(false);

  if (obligations.isPending) return <StateView kind="loading" />;
  const obligation = obligations.data?.find((o) => o.id === obligationId);
  if (obligations.isError || !obligation) {
    return (
      <ErrorState
        title={obligations.isError ? t('common.error') : t('vehicles.obligationNotFound')}
        message={obligations.error?.message}
        actionLabel={t('common.retry')}
        onAction={() => void obligations.refetch()}
      />
    );
  }

  return (
    <Screen scroll edges={['bottom']}>
      <Stack.Screen options={{ title: t('vehicles.obligationEditTitle') }} />
      <ObligationForm
        obligation={obligation}
        pending={update.isPending}
        error={update.error}
        onSubmit={(values) =>
          update.mutate(
            { vehicleId, obligationId, ...buildObligationRequest(values, obligation) },
            {
              onSuccess: () => {
                toast.success(t('vehicles.obligationSaved'));
                router.back();
              },
            },
          )
        }
      />
      <Button
        title={t('vehicles.obligationDelete')}
        variant="danger"
        onPress={() => setConfirm(true)}
      />
      <ConfirmDialog
        visible={confirm}
        title={t('vehicles.obligationDeleteTitle', {
          type: enumLabel('vehicleObligationType', obligation.type),
        })}
        message={
          obligation.hasExpense
            ? t('vehicles.obligationDeleteWithExpense')
            : t('vehicles.obligationDeleteMessage')
        }
        confirmLabel={t('common.delete')}
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirm(false)}
        onConfirm={() =>
          remove.mutate(
            { vehicleId, obligationId, hasExpense: obligation.hasExpense },
            {
              onSuccess: () => {
                setConfirm(false);
                toast.success(t('vehicles.obligationDeleted'));
                router.back();
              },
              onError: (e) => {
                setConfirm(false);
                toast.error(e.message);
              },
            },
          )
        }
      />
    </Screen>
  );
}
