import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { LedgerItemForm } from '@/features/ledger/components/LedgerItemForm';
import { LEDGER_PERMISSIONS } from '@/features/ledger/constants';
import { useLedgerItemSave } from '@/features/ledger/useLedgerItemSave';
import type { LedgerDirection } from '@/lib/domain/enums';
import { todayIso } from '@/lib/format/period';
import { toast } from '@/stores/toastStore';

/** Yeni elle kalem: /ledger/new?year=2026[&direction=Expense] */
export default function NewLedgerItemScreen() {
  return (
    <RequirePermission permission={LEDGER_PERMISSIONS.CREATE}>
      <NewLedgerItem />
    </RequirePermission>
  );
}

function NewLedgerItem() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ year?: string; direction?: string }>();
  const year = Number(params.year) || Number(todayIso().slice(0, 4));
  const direction: LedgerDirection = params.direction === 'Expense' ? 'Expense' : 'Income';
  const canEditAmounts = useHasPermission(LEDGER_PERMISSIONS.UPDATE);
  const [original] = useState<(number | null)[]>(() => Array<number | null>(12).fill(null));
  const { save, pending, error } = useLedgerItemSave();

  return (
    <Screen scroll edges={['bottom']}>
      <Stack.Screen options={{ title: t('ledger.form.newTitle') }} />
      <LedgerItemForm
        year={year}
        initialMonths={original}
        canEditAmounts={canEditAmounts}
        defaultDirection={direction}
        pending={pending}
        error={error}
        onSubmit={async (values) => {
          const saved = await save({ year, original, values, canEditAmounts });
          if (saved) {
            toast.success(t('ledger.form.created'));
            router.back();
          }
        }}
      />
    </Screen>
  );
}
