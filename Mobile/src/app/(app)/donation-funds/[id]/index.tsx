import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';

import {
  Badge,
  Button,
  ConfirmDialog,
  ErrorState,
  SkeletonList,
  StateView,
  Text,
} from '@/components/ui';
import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { MovementSheet } from '@/features/donationFunds/components/MovementSheet';
import { RequireDonationExtras } from '@/features/donationFunds/components/RequireDonationExtras';
import { DONATION_FUND_PERMISSIONS } from '@/features/donationFunds/constants';
import { fundProgress } from '@/features/donationFunds/fundForm';
import {
  useDeleteDonationFund,
  useDonationFund,
  useFundDistributions,
  useFundMovements,
} from '@/features/donationFunds/hooks';
import type { FundMovement } from '@/features/donationFunds/types';
import { DonationRow } from '@/features/donations/components/DonationRow';
import { DONATION_PERMISSIONS } from '@/features/donations/constants';
import {
  KeyValue,
  OutlineAction,
  ProgressBar,
  SectionHeader,
} from '@/features/recurringPayments/components/form/Bits';
import { enumLabel } from '@/lib/domain/enums';
import { formatMoney } from '@/lib/format/money';
import { formatDisplayDate } from '@/lib/format/period';
import { toast } from '@/stores/toastStore';

/** Emanet detayı: tutarlar (alınan, dağıtılan, kullanımda, elde), hareketler ve dağıtımlar (bağış kayıtları). */
export default function DonationFundDetailScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('donationFunds.detailTitle') }} />
      <RequireDonationExtras>
        <RequirePermission permission={DONATION_FUND_PERMISSIONS.READ}>
          <FundDetail />
        </RequirePermission>
      </RequireDonationExtras>
    </>
  );
}

function FundDetail() {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const fund = useDonationFund(id);
  const movements = useFundMovements(id);
  const distributions = useFundDistributions(id);
  const remove = useDeleteDonationFund();
  const canUpdate = useHasPermission(DONATION_FUND_PERMISSIONS.UPDATE);
  const canDelete = useHasPermission(DONATION_FUND_PERMISSIONS.DELETE);
  const canDonate = useHasPermission(DONATION_PERMISSIONS.CREATE);
  const canUpdateDonation = useHasPermission(DONATION_PERMISSIONS.UPDATE);
  const canDeleteDonation = useHasPermission(DONATION_PERMISSIONS.DELETE);
  const canOpenDonation = canUpdateDonation || canDeleteDonation;
  const [sheet, setSheet] = useState<{ movement: FundMovement | null } | null>(null);
  const [confirming, setConfirming] = useState(false);

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
  const refreshing = fund.isRefetching || movements.isRefetching || distributions.isRefetching;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.primary}
          colors={[colors.primary]}
          progressBackgroundColor={colors.background}
          onRefresh={() => {
            void fund.refetch();
            void movements.refetch();
            void distributions.refetch();
          }}
        />
      }
    >
      <View style={styles.card}>
        <View style={styles.line}>
          <View style={styles.flex}>
            <Text variant="h2">{f.fromPersonName}</Text>
            <Text variant="label" muted>
              {`${enumLabel('donationKind', f.kind)} · ${t('donationFunds.receivedOn', { date: formatDisplayDate(f.date) })}`}
            </Text>
          </View>
          {f.isClosed ? <Badge label={t('donationFunds.closed')} variant="neutral" /> : null}
        </View>
        <ProgressBar value={fundProgress(f)} tone="primary" />
        <View style={styles.line}>
          <KeyValue label={t('donationFunds.amounts.received')} value={formatMoney(f.amount)} />
          <KeyValue
            label={t('donationFunds.amounts.distributed')}
            value={formatMoney(f.distributed)}
          />
        </View>
        <View style={styles.line}>
          <KeyValue label={t('donationFunds.amounts.inUse')} value={formatMoney(f.inUse)} />
          <KeyValue label={t('donationFunds.onHand')} value={formatMoney(f.onHand)} />
        </View>
        {f.note ? (
          <Text variant="label" muted>
            {f.note}
          </Text>
        ) : null}
        <Text variant="caption" muted>
          {t('donationFunds.notInTotals')}
        </Text>
        {canDonate && f.onHand > 0 ? (
          <OutlineAction
            fullWidth
            icon="volunteer-activism"
            label={t('donationFunds.donateFrom')}
            onPress={() =>
              router.push({ pathname: '/donations/new', params: { fundId: String(f.id) } })
            }
          />
        ) : null}
      </View>

      <SectionHeader
        title={t('donationFunds.movements')}
        actionLabel={canUpdate ? t('donationFunds.movement.add') : undefined}
        actionIcon="add"
        onAction={canUpdate ? () => setSheet({ movement: null }) : undefined}
      />
      {movements.isPending ? (
        <SkeletonList rows={2} />
      ) : movements.isError ? (
        <ErrorState
          title={t('common.error')}
          message={movements.error.message}
          actionLabel={t('common.retry')}
          onAction={() => void movements.refetch()}
        />
      ) : movements.data.length === 0 ? (
        <Text variant="label" muted style={styles.emptyLine}>
          {t('donationFunds.noMovements')}
        </Text>
      ) : (
        <View style={styles.list}>
          {movements.data.map((m, i) => {
            const label = enumLabel('fundMovementType', m.type);
            const amount = `${m.type === 'Use' ? '−' : '+'}${formatMoney(m.amount)}`;
            return (
              <Pressable
                key={m.id}
                accessibilityRole={canUpdate ? 'button' : undefined}
                accessibilityLabel={[label, formatDisplayDate(m.date), m.note, amount]
                  .filter(Boolean)
                  .join(', ')}
                disabled={!canUpdate}
                onPress={() => setSheet({ movement: m })}
                style={({ pressed }) => [
                  styles.row,
                  i > 0 && styles.divider,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.flex}>
                  <Text variant="bodyStrong">{label}</Text>
                  <Text variant="caption" muted numberOfLines={2}>
                    {[formatDisplayDate(m.date), m.note].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Text
                  variant="bodyStrong"
                  tabular
                  color={m.type === 'Use' ? colors.danger : colors.text}
                >
                  {amount}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <SectionHeader title={t('donationFunds.distributions', { count: f.distributionCount })} />
      {distributions.isPending ? (
        <SkeletonList rows={2} />
      ) : distributions.isError ? (
        <ErrorState
          title={t('common.error')}
          message={distributions.error.message}
          actionLabel={t('common.retry')}
          onAction={() => void distributions.refetch()}
        />
      ) : distributions.data.length === 0 ? (
        <Text variant="label" muted style={styles.emptyLine}>
          {t('donationFunds.noDistributions')}
        </Text>
      ) : (
        <View style={styles.list}>
          {distributions.data.map((d, i) => (
            <DonationRow
              key={d.id}
              donation={d}
              last={i === distributions.data.length - 1}
              onPress={
                canOpenDonation
                  ? () => router.push({ pathname: '/donations/[id]', params: { id: String(d.id) } })
                  : undefined
              }
            />
          ))}
        </View>
      )}

      {canUpdate ? (
        <Button
          title={t('donationFunds.edit')}
          variant="secondary"
          onPress={() =>
            router.push({ pathname: '/donation-funds/[id]/edit', params: { id: String(f.id) } })
          }
        />
      ) : null}
      {canDelete ? (
        <Button
          title={t('donationFunds.delete')}
          variant="danger"
          onPress={() => setConfirming(true)}
        />
      ) : null}

      <MovementSheet
        visible={!!sheet}
        fundId={f.id}
        movement={sheet?.movement ?? null}
        onHand={f.onHand}
        canDelete={canUpdate}
        onClose={() => setSheet(null)}
      />
      <ConfirmDialog
        visible={confirming}
        title={t('donationFunds.deleteTitle')}
        message={t('donationFunds.deleteMessage')}
        confirmLabel={t('common.delete')}
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          remove.mutate(f.id, {
            onSuccess: () => {
              setConfirming(false);
              toast.success(t('donationFunds.toast.deleted'));
              router.back();
            },
            onError: (e) => {
              setConfirming(false);
              toast.error(e.message);
            },
          })
        }
      />
    </ScrollView>
  );
}

const useStyles = makeStyles((c) => ({
  content: { padding: Spacing.lg, gap: Spacing.md },
  card: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    padding: 14,
    gap: Spacing.md,
  },
  line: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1, gap: 2 },
  list: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  divider: { borderTopWidth: 1, borderTopColor: c.border },
  pressed: { backgroundColor: c.surface },
  emptyLine: { paddingHorizontal: Spacing.xs },
}));
