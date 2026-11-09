import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, ConfirmDialog, ErrorState, Screen, StateView } from '@/components/ui';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { VehicleForm } from '@/features/vehicles/components/VehicleForm';
import { VEHICLE_PERMISSIONS } from '@/features/vehicles/constants';
import { useDeleteVehicle, useUpdateVehicle, useVehicle } from '@/features/vehicles/hooks';
import { vehicleRoutes } from '@/features/vehicles/routes';
import { toast } from '@/stores/toastStore';

/** Araç düzenle (ad, plaka, sahip, not, aktiflik) ve yetkiye göre sil. */
export default function EditVehicleScreen() {
  return (
    <RequirePermission permission={VEHICLE_PERMISSIONS.UPDATE}>
      <EditVehicle />
    </RequirePermission>
  );
}

function EditVehicle() {
  const { t } = useTranslation();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const vehicle = useVehicle(id);
  const update = useUpdateVehicle();
  const remove = useDeleteVehicle();
  const canDelete = useHasPermission(VEHICLE_PERMISSIONS.DELETE);
  const [confirm, setConfirm] = useState(false);

  if (vehicle.isPending) return <StateView kind="loading" />;
  if (vehicle.isError || !vehicle.data) {
    return (
      <ErrorState
        title={t('common.error')}
        message={vehicle.error?.message}
        actionLabel={t('common.retry')}
        onAction={() => void vehicle.refetch()}
      />
    );
  }
  const v = vehicle.data;

  return (
    <Screen scroll edges={['bottom']}>
      <Stack.Screen options={{ title: t('vehicles.editTitle') }} />
      <VehicleForm
        vehicle={v}
        pending={update.isPending}
        error={update.error}
        onSubmit={(values) =>
          update.mutate(
            { id, ...values },
            {
              onSuccess: () => {
                toast.success(t('vehicles.saved'));
                router.back();
              },
            },
          )
        }
      />
      {canDelete ? (
        <Button title={t('vehicles.delete')} variant="danger" onPress={() => setConfirm(true)} />
      ) : null}
      <ConfirmDialog
        visible={confirm}
        title={t('vehicles.deleteTitle')}
        message={t('vehicles.deleteMessage', { name: v.name })}
        confirmLabel={t('common.delete')}
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirm(false)}
        onConfirm={() =>
          remove.mutate(id, {
            onSuccess: () => {
              setConfirm(false);
              toast.success(t('vehicles.deleted'));
              router.dismissTo(vehicleRoutes.index);
            },
            onError: (e) => {
              setConfirm(false);
              toast.error(e.message);
            },
          })
        }
      />
    </Screen>
  );
}
