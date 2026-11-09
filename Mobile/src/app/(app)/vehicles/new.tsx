import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { VehicleForm } from '@/features/vehicles/components/VehicleForm';
import { VEHICLE_PERMISSIONS } from '@/features/vehicles/constants';
import { useCreateVehicle } from '@/features/vehicles/hooks';
import { vehicleRoutes } from '@/features/vehicles/routes';
import { toast } from '@/stores/toastStore';

/** Araç ekle; kayıttan sonra araç detayına geçilir (geri tuşu listeye döner). */
export default function NewVehicleScreen() {
  return (
    <RequirePermission permission={VEHICLE_PERMISSIONS.CREATE}>
      <NewVehicle />
    </RequirePermission>
  );
}

function NewVehicle() {
  const { t } = useTranslation();
  const create = useCreateVehicle();
  return (
    <Screen scroll edges={['bottom']}>
      <Stack.Screen options={{ title: t('vehicles.newTitle') }} />
      <VehicleForm
        pending={create.isPending}
        error={create.error}
        onSubmit={(v) =>
          create.mutate(
            { name: v.name, plate: v.plate, ownerPersonId: v.ownerPersonId, note: v.note },
            {
              onSuccess: (vehicle) => {
                toast.success(t('vehicles.created'));
                router.replace(vehicleRoutes.detail(vehicle.id));
              },
            },
          )
        }
      />
    </Screen>
  );
}
