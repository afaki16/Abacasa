import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';

import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  SkeletonList,
  StateView,
  Text,
} from '@/components/ui';
import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { debtTitle } from '@/features/debts/components/DebtCard';
import { PaymentSheet } from '@/features/debts/components/PaymentSheet';
import { DEBT_PAYMENT_PERMISSIONS, DEBT_PERMISSIONS } from '@/features/debts/constants';
import { debtProgress } from '@/features/debts/debtForm';
import { useDebt, useDebtPayments, useDeleteDebt } from '@/features/debts/hooks';
import type { DebtPayment } from '@/features/debts/types';
import {
  KeyValue,
  ProgressBar,
  SectionHeader,
} from '@/features/recurringPayments/components/form/Bits';
import { plural } from '@/lib/i18n';
import { formatAmount, formatMoney, formatNumber } from '@/lib/format/money';
import { formatDisplayDate } from '@/lib/format/period';
import { toast } from '@/stores/toastStore';

/** Borç detayı = Ödemeler: borç özeti (toplam / ödenen / kalan), ödeme listesi, ödeme ekle / düzenle / sil. */
export default function DebtDetailScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('debts.payments') }} />
      <RequirePermission permission={DEBT_PERMISSIONS.READ}>
        <DebtDetail />
      </RequirePermission>
    </>
  );
}

function DebtDetail() {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const debt = useDebt(id);
  const payments = useDebtPayments(id);
  const remove = useDeleteDebt();
  const canUpdate = useHasPermission(DEBT_PERMISSIONS.UPDATE);
  const canDelete = useHasPermission(DEBT_PERMISSIONS.DELETE);
  const canAddPayment = useHasPermission(DEBT_PAYMENT_PERMISSIONS.CREATE);
  const canEditPayment = useHasPermission(DEBT_PAYMENT_PERMISSIONS.UPDATE);
  const canDeletePayment = useHasPermission(DEBT_PAYMENT_PERMISSIONS.DELETE);
  const [sheet, setSheet] = useState<{ payment: DebtPayment | null } | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (debt.isPending) return <StateView kind="loading" />;
  if (debt.isError || !debt.data) {
    return (
      <StateView
        kind="error"
        message={debt.error?.message}
        actionLabel={t('common.retry')}
        onAction={() => void debt.refetch()}
      />
    );
  }
  const d = debt.data;
  const household = t('debts.household');
  const list = payments.data ?? [];
  const canAdd = canAddPayment && d.remaining > 0;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={debt.isRefetching || payments.isRefetching}
          tintColor={colors.primary}
          colors={[colors.primary]}
          progressBackgroundColor={colors.background}
          onRefresh={() => {
            void debt.refetch();
            void payments.refetch();
          }}
        />
      }
    >
      <View style={styles.card}>
        <View style={styles.line}>
          <View style={styles.flex}>
            <Text variant="h2">{debtTitle(d, household)}</Text>
            <Text variant="label" muted>
              {t('debts.detail.parties', {
                creditor: d.creditorName,
                debtor: d.debtorName ?? household,
              })}
            </Text>
          </View>
          {d.isClosed ? <Badge label={t('debts.closed')} variant="paid" /> : null}
        </View>
        <ProgressBar value={debtProgress(d)} tone={d.isClosed ? 'success' : 'primary'} />
        <View style={styles.line}>
          <KeyValue label={t('debts.detail.total')} value={formatAmount(d.amount, d.currency)} />
          <KeyValue label={t('debts.card.paid')} value={formatAmount(d.paidAmount, d.currency)} />
          <KeyValue
            label={t('debts.card.left')}
            value={formatAmount(d.remaining, d.currency)}
            align="right"
          />
        </View>
        <Text variant="caption" muted tabular>
          {[
            t('debts.detail.date', { date: formatDisplayDate(d.date) }),
            d.currency !== 'TRY' && d.remainingInTry !== null
              ? t('debts.detail.leftInTry', { amount: formatMoney(d.remainingInTry) })
              : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>

      <SectionHeader
        title={plural('debts.detail.paymentCount', list.length, { count: list.length })}
        actionLabel={canAdd ? t('debts.payment.add') : undefined}
        actionIcon="add"
        onAction={canAdd ? () => setSheet({ payment: null }) : undefined}
      />

      {payments.isPending ? (
        <SkeletonList rows={3} />
      ) : payments.isError ? (
        <ErrorState
          title={t('common.error')}
          message={payments.error.message}
          actionLabel={t('common.retry')}
          onAction={() => void payments.refetch()}
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon="payments"
          title={t('debts.detail.noPayments')}
          actionLabel={canAdd ? t('debts.payment.add') : undefined}
          actionIcon="add"
          onAction={canAdd ? () => setSheet({ payment: null }) : undefined}
        />
      ) : (
        <View style={styles.list}>
          {list.map((p, i) => {
            const meta = [
              p.exchangeRate != null
                ? t('debts.detail.rate', { rate: formatNumber(p.exchangeRate, 4) })
                : null,
              p.note,
            ]
              .filter(Boolean)
              .join(' · ');
            const amount = formatAmount(p.amount, d.currency);
            const openable = canEditPayment || canDeletePayment;
            return (
              <Pressable
                key={p.id}
                accessibilityRole={openable ? 'button' : undefined}
                accessibilityLabel={[
                  formatDisplayDate(p.date),
                  meta,
                  amount,
                  d.currency !== 'TRY' ? formatMoney(p.amountInTry) : null,
                ]
                  .filter(Boolean)
                  .join(', ')}
                disabled={!openable}
                onPress={() => setSheet({ payment: p })}
                style={({ pressed }) => [
                  styles.row,
                  i > 0 && styles.divider,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.flex}>
                  <Text variant="bodyStrong" tabular>
                    {formatDisplayDate(p.date)}
                  </Text>
                  {meta ? (
                    <Text variant="caption" muted numberOfLines={2}>
                      {meta}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.right}>
                  <Text variant="bodyStrong" tabular style={styles.rightText}>
                    {amount}
                  </Text>
                  {d.currency !== 'TRY' ? (
                    <Text variant="caption" muted tabular style={styles.rightText}>
                      {formatMoney(p.amountInTry)}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {canUpdate ? (
        <Button
          title={t('debts.edit')}
          variant="secondary"
          onPress={() =>
            router.push({ pathname: '/debts/[id]/edit', params: { id: String(d.id) } })
          }
        />
      ) : null}
      {canDelete ? (
        <Button title={t('debts.delete')} variant="danger" onPress={() => setConfirming(true)} />
      ) : null}

      <PaymentSheet
        visible={!!sheet}
        debt={d}
        payment={sheet?.payment ?? null}
        canDelete={canDeletePayment}
        onClose={() => setSheet(null)}
      />
      <ConfirmDialog
        visible={confirming}
        title={t('debts.deleteTitle')}
        message={d.hasPayments ? t('debts.deleteHasPayments') : t('debts.deleteMessage')}
        confirmLabel={t('common.delete')}
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          remove.mutate(d.id, {
            onSuccess: () => {
              setConfirming(false);
              toast.success(t('debts.toast.deleted'));
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
    minHeight: 60,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  divider: { borderTopWidth: 1, borderTopColor: c.border },
  pressed: { backgroundColor: c.surface },
  right: { alignItems: 'flex-end', gap: 2 },
  rightText: { textAlign: 'right' },
}));
