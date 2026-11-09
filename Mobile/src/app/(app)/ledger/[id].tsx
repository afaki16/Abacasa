import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button, ConfirmDialog, ErrorState, Screen, StateView } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { InUseDialog } from '@/features/categories/components/DefinitionKit';
import { LedgerItemForm } from '@/features/ledger/components/LedgerItemForm';
import { LEDGER_PERMISSIONS } from '@/features/ledger/constants';
import {
  useDeleteLedgerItem,
  useLedgerItem,
  useLedgerYear,
  useUpdateLedgerItem,
} from '@/features/ledger/hooks';
import type { LedgerItem } from '@/features/ledger/types';
import { useLedgerItemSave } from '@/features/ledger/useLedgerItemSave';
import { manualItemMonths } from '@/features/ledger/yearView';
import type { ApiError } from '@/lib/api';
import { todayIso } from '@/lib/format/period';
import { toast } from '@/stores/toastStore';

/** Elle kalem düzenle: /ledger/12?year=2026 — ad, yön, kişi, aktiflik ve yılın aylık tutarları. */
export default function EditLedgerItemScreen() {
  return (
    <RequirePermission permission={LEDGER_PERMISSIONS.UPDATE}>
      <EditLedgerItem />
    </RequirePermission>
  );
}

function EditLedgerItem() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id: string; year?: string }>();
  const id = Number(params.id);
  const year = Number(params.year) || Number(todayIso().slice(0, 4));
  const item = useLedgerItem(id);
  const yearData = useLedgerYear(year);

  if (item.isPending || yearData.isPending) return <StateView kind="loading" />;
  if (item.isError || yearData.isError) {
    const error = item.error ?? yearData.error;
    return (
      <ErrorState
        title={t('common.error')}
        message={error?.message}
        actionLabel={t('common.retry')}
        onAction={() => {
          void item.refetch();
          void yearData.refetch();
        }}
      />
    );
  }
  return <EditForm item={item.data} year={year} months={manualItemMonths(yearData.data, id)} />;
}

function EditForm({
  item,
  year,
  months,
}: {
  item: LedgerItem;
  year: number;
  months: (number | null)[];
}) {
  const { t } = useTranslation();
  const canDelete = useHasPermission(LEDGER_PERMISSIONS.DELETE);
  // Form açıldığındaki değerler; yalnızca değişen hücreler yazılır.
  const [original] = useState(months);
  const { save, pending, error } = useLedgerItemSave();
  const remove = useDeleteLedgerItem();
  const update = useUpdateLedgerItem();
  const [confirm, setConfirm] = useState(false);
  const [inUse, setInUse] = useState<ApiError | null>(null);

  const doDelete = () =>
    remove.mutate(item.id, {
      onSuccess: () => {
        setConfirm(false);
        toast.success(t('ledger.form.deleted'));
        router.back();
      },
      onError: (e) => {
        setConfirm(false);
        if (e.status === 409) setInUse(e);
        else toast.error(e.message);
      },
    });

  const deactivate = () =>
    update.mutate(
      {
        id: item.id,
        name: item.name,
        direction: item.direction,
        ownerPersonId: item.ownerPersonId,
        isActive: false,
      },
      {
        onSuccess: () => {
          setInUse(null);
          toast.success(t('ledger.form.deactivated'));
          router.back();
        },
        onError: (e) => toast.error(e.message),
      },
    );

  return (
    <Screen scroll edges={['bottom']}>
      <Stack.Screen options={{ title: t('ledger.form.editTitle') }} />
      <LedgerItemForm
        item={item}
        year={year}
        initialMonths={original}
        canEditAmounts
        pending={pending}
        error={error}
        onSubmit={async (values) => {
          const saved = await save({ item, year, original, values, canEditAmounts: true });
          if (saved) {
            toast.success(t('ledger.form.saved'));
            router.back();
          }
        }}
      />
      {canDelete ? (
        <View style={styles.delete}>
          <Button
            title={t('ledger.form.delete')}
            variant="danger"
            onPress={() => setConfirm(true)}
          />
        </View>
      ) : null}
      <ConfirmDialog
        visible={confirm}
        title={t('ledger.form.deleteTitle')}
        message={t('ledger.form.deleteMessage', { name: item.name })}
        confirmLabel={t('common.delete')}
        destructive
        loading={remove.isPending}
        onConfirm={doDelete}
        onCancel={() => setConfirm(false)}
      />
      <InUseDialog
        visible={!!inUse}
        title={t('ledger.form.inUseTitle', { name: item.name })}
        message={inUse?.message}
        onClose={() => setInUse(null)}
        secondaryLabel={item.isActive ? t('ledger.form.makePassive') : undefined}
        onSecondary={deactivate}
        secondaryLoading={update.isPending}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  delete: { marginTop: -Spacing.sm },
});
