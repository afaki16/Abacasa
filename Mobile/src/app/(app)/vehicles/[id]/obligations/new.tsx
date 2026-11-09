import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { ObligationForm } from '@/features/vehicles/components/ObligationForm';
import { VEHICLE_PERMISSIONS } from '@/features/vehicles/constants';
import { useCreateVehicleObligation } from '@/features/vehicles/hooks';
import { buildObligationRequest } from '@/features/vehicles/obligations';
import { OBLIGATION_TYPES } from '@/features/vehicles/reminders';
import type { VehicleObligationType } from '@/lib/domain/enums';
import { toast } from '@/stores/toastStore';

/** Araç işlemi ekle: /vehicles/5/obligations/new[?type=Kasko]. İşlem eklemek Vehicles.Update ister. */
export default function NewObligationScreen() {
  return (
    <RequirePermission permission={VEHICLE_PERMISSIONS.UPDATE}>
      <NewObligation />
    </RequirePermission>
  );
}

function NewObligation() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id: string; type?: string }>();
  const vehicleId = Number(params.id);
  const type = OBLIGATION_TYPES.find((x) => x === params.type) as VehicleObligationType | undefined;
  const create = useCreateVehicleObligation();

  return (
    <Screen scroll edges={['bottom']}>
      <Stack.Screen options={{ title: t('vehicles.obligationNewTitle') }} />
      <ObligationForm
        defaultType={type}
        pending={create.isPending}
        error={create.error}
        onSubmit={(values) =>
          create.mutate(
            { vehicleId, ...buildObligationRequest(values) },
            {
              onSuccess: (o) => {
                toast.success(
                  o.hasExpense
                    ? t('vehicles.obligationCreatedWithExpense')
                    : t('vehicles.obligationCreated'),
                );
                router.back();
              },
            },
          )
        }
      />
    </Screen>
  );
}
