import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, StateView } from '@/components/ui';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useDonationFund } from '@/features/donationFunds/hooks';
import { DonationForm } from '@/features/donations/components/DonationForm';
import { DONATION_PERMISSIONS } from '@/features/donations/constants';
import { useCreateDonation } from '@/features/donations/hooks';
import { toast } from '@/stores/toastStore';

/** Bağış ekle (/donations/new). ?fundId= ile emanet detayından gelinirse "Emanetten ver" seçili açılır. */
export default function NewDonationScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('donations.newTitle') }} />
      <RequirePermission permission={DONATION_PERMISSIONS.CREATE}>
        <NewDonation />
      </RequirePermission>
    </>
  );
}

function NewDonation() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ fundId?: string }>();
  const fundId = params.fundId ? Number(params.fundId) : NaN;
  const fund = useDonationFund(fundId);
  const create = useCreateDonation();

  if (Number.isFinite(fundId) && fund.isPending) return <StateView kind="loading" />;

  return (
    <Screen scroll edges={['bottom']}>
      <DonationForm
        initialFund={fund.data ? { id: fund.data.id, kind: fund.data.kind } : null}
        pending={create.isPending}
        error={create.error}
        onSubmit={(request) =>
          create.mutate(request, {
            onSuccess: () => {
              toast.success(t('donations.toast.created'));
              router.back();
            },
          })
        }
      />
    </Screen>
  );
}
