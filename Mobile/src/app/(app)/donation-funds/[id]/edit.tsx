import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, StateView } from '@/components/ui';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { FundForm } from '@/features/donationFunds/components/FundForm';
import { RequireDonationExtras } from '@/features/donationFunds/components/RequireDonationExtras';
import { DONATION_FUND_PERMISSIONS } from '@/features/donationFunds/constants';
import { useDonationFund, useUpdateDonationFund } from '@/features/donationFunds/hooks';
import { toast } from '@/stores/toastStore';

/** Emanet düzenle (/donation-funds/[id]/edit). */
export default function EditDonationFundScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('donationFunds.editTitle') }} />
      <RequireDonationExtras>
        <RequirePermission permission={DONATION_FUND_PERMISSIONS.UPDATE}>
          <EditFund />
        </RequirePermission>
      </RequireDonationExtras>
    </>
  );
}

function EditFund() {
  const { t } = useTranslation();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const fund = useDonationFund(id);
  const update = useUpdateDonationFund();

  if (fund.isPending) return <StateView kind="loading" />;
  if (fund.isError || !fund.data) {
    return (
      <StateView
        kind="error"
        message={fund.error?.message}
        actionLabel={t('common.retry')}
        onAction={() => void fund.refetch()}
      />
    );
  }
  const f = fund.data;

  return (
    <Screen scroll edges={['bottom']}>
      <FundForm
        key={f.id}
        fund={f}
        pending={update.isPending}
        error={update.error}
        onSubmit={(request) =>
          update.mutate(
            { ...request, id: f.id },
            {
              onSuccess: () => {
                toast.success(t('donationFunds.toast.updated'));
                router.back();
              },
            },
          )
        }
      />
    </Screen>
  );
}
