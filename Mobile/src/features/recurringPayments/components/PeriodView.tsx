import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';

import {
  Badge,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Icon,
  SkeletonList,
  Text,
} from '@/components/ui';
import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { hasPermission, useHasPermission } from '@/features/auth/permissions';
import { plural } from '@/lib/i18n';
import { formatMoney } from '@/lib/format/money';
import { monthRange, todayIso } from '@/lib/format/period';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/stores/toastStore';

import { RECURRING_PAYMENT_PERMISSIONS } from '../constants';
import {
  countByPaid,
  kindIcon,
  occurrenceAmountText,
  occurrenceMeta,
  occurrenceStatus,
  sortOccurrences,
  STATUS_BADGE,
} from '../display';
import {
  usePayRecurringPayment,
  useRecurringPaymentOccurrences,
  useUndoRecurringPayment,
} from '../hooks';
import { getLinkedRecord, occurrenceKey, undoPermission } from '../occurrences';
import type { LinkedRecord, RecurringPaymentOccurrence } from '../types';
import { KeyValue, OutlineAction, ProgressBar, WarningNote } from './form/Bits';
import { MonthStepper } from './form/MonthStepper';
import { PaySheet } from './PaySheet';

/** Sabit ödemeler · Dönem: ay seçici, ödenen/bekleyen özeti, vadeler (öde / geri al). */
export function PeriodView() {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const today = todayIso();
  const [ym, setYm] = useState(() => {
    const [y, m] = today.split('-').map(Number);
    return { year: y, month: m };
  });
  const range = monthRange(ym.year, ym.month);
  const query = useRecurringPaymentOccurrences({ start: range.start, end: range.end });
  const pay = usePayRecurringPayment();
  const undo = useUndoRecurringPayment();
  const canPay = useHasPermission(RECURRING_PAYMENT_PERMISSIONS.PAY);
  const canCreate = useHasPermission(RECURRING_PAYMENT_PERMISSIONS.CREATE);
  const user = useAuthStore((s) => s.user);
  const [paying, setPaying] = useState<RecurringPaymentOccurrence | null>(null);
  const [undoing, setUndoing] = useState<RecurringPaymentOccurrence | null>(null);

  const runUndo = (record: LinkedRecord) =>
    undo.mutate(record, {
      onSuccess: () => {
        setUndoing(null);
        toast.success(t('recurring.toast.undone'));
      },
      onError: (e) => {
        setUndoing(null);
        toast.error(e.message);
      },
    });

  const data = query.data;
  const items = data ? sortOccurrences(data.items) : [];
  const counts = countByPaid(items);
  const sum = (data?.paidTotal ?? 0) + (data?.pendingTotal ?? 0);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          tintColor={colors.primary}
          colors={[colors.primary]}
          progressBackgroundColor={colors.background}
          onRefresh={() => void query.refetch()}
        />
      }
    >
      <MonthStepper year={ym.year} month={ym.month} onChange={setYm} />

      {query.isPending ? (
        <SkeletonList card rows={4} />
      ) : query.isError ? (
        <ErrorState
          title={t('common.error')}
          message={query.error.message}
          actionLabel={t('common.retry')}
          onAction={() => void query.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon="event-repeat"
          title={t('recurring.period.emptyTitle')}
          message={t('recurring.period.emptyMessage')}
          actionLabel={canCreate ? t('recurring.plans.add') : undefined}
          actionIcon="add"
          onAction={canCreate ? () => router.push('/recurring/new') : undefined}
        />
      ) : (
        <>
          <View style={styles.summary}>
            <ProgressBar value={sum > 0 ? (data?.paidTotal ?? 0) / sum : 0} />
            <View style={styles.summaryRow}>
              <KeyValue
                label={t('recurring.period.paid', { n: counts.paid })}
                value={formatMoney(data?.paidTotal ?? 0)}
              />
              <KeyValue
                align="right"
                label={t('recurring.period.pending', { n: counts.pending })}
                value={formatMoney(data?.pendingTotal ?? 0)}
              />
            </View>
          </View>

          {data && data.unknownCount > 0 ? (
            <WarningNote>
              {plural('recurring.period.unknownWarning', data.unknownCount, {
                count: data.unknownCount,
              })}
            </WarningNote>
          ) : null}

          <View style={styles.card}>
            {items.map((o, index) => {
              const status = occurrenceStatus(o, today);
              const undoPerm = undoPermission(o);
              const canUndo = !!undoPerm && hasPermission(user, undoPerm);
              const amountText = occurrenceAmountText(o);
              return (
                <View key={occurrenceKey(o)} style={[styles.item, index > 0 && styles.divider]}>
                  <Pressable
                    accessibilityRole={canUndo ? 'button' : undefined}
                    accessibilityLabel={[
                      o.name,
                      occurrenceMeta(o, today),
                      amountText,
                      t(`recurring.status.${status}`),
                    ].join(', ')}
                    accessibilityHint={canUndo ? t('recurring.undo.hint') : undefined}
                    disabled={!canUndo}
                    onPress={() => setUndoing(o)}
                    style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                  >
                    <View style={styles.tile}>
                      <Icon name={kindIcon(o.kind)} size={22} color={colors.iconTileText} />
                    </View>
                    <View style={styles.texts}>
                      <Text variant="bodyStrong" numberOfLines={2}>
                        {o.name}
                      </Text>
                      <Text variant="caption" muted numberOfLines={2}>
                        {occurrenceMeta(o, today)}
                      </Text>
                    </View>
                    <View style={styles.right}>
                      <Text
                        variant="bodyStrong"
                        tabular
                        color={amountText === '—' ? colors.badges.pending.fg : colors.text}
                        style={styles.rightText}
                      >
                        {amountText}
                      </Text>
                      <Badge
                        label={t(`recurring.status.${status}`)}
                        variant={STATUS_BADGE[status]}
                        style={styles.badge}
                      />
                    </View>
                  </Pressable>
                  {!o.isPaid && canPay ? (
                    <View style={styles.action}>
                      <OutlineAction
                        fullWidth
                        icon="check"
                        label={t('recurring.pay.markPaid')}
                        accessibilityLabel={`${t('recurring.pay.markPaid')}: ${o.name}`}
                        onPress={() => {
                          pay.reset();
                          setPaying(o);
                        }}
                      />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </>
      )}

      <PaySheet
        occurrence={paying}
        onClose={() => setPaying(null)}
        pending={pay.isPending}
        error={pay.error}
        onSubmit={(request) => {
          if (!paying) return;
          const occurrence = paying;
          pay.mutate(
            { recurringPaymentId: occurrence.recurringPaymentId, ...request },
            {
              onSuccess: (result) => {
                setPaying(null);
                const perm = undoPermission({
                  isPaid: true,
                  expenseId: result.type === 'expense' ? result.id : null,
                  donationId: result.type === 'donation' ? result.id : null,
                });
                const allowed = !!perm && hasPermission(useAuthStore.getState().user, perm);
                toast.success(t('recurring.toast.paid'), {
                  action: allowed
                    ? { label: t('ui.undo'), onPress: () => runUndo(result) }
                    : undefined,
                });
              },
            },
          );
        }}
      />

      <ConfirmDialog
        visible={!!undoing}
        title={t('recurring.undo.title')}
        message={
          undoing
            ? t(
                getLinkedRecord(undoing)?.type === 'donation'
                  ? 'recurring.undo.messageDonation'
                  : 'recurring.undo.messageExpense',
                {
                  name: undoing.name,
                },
              )
            : undefined
        }
        confirmLabel={t('recurring.undo.confirm')}
        destructive
        loading={undo.isPending}
        onCancel={() => setUndoing(null)}
        onConfirm={() => {
          const record = undoing && getLinkedRecord(undoing);
          if (record) runUndo(record);
        }}
      />
    </ScrollView>
  );
}

const useStyles = makeStyles((c) => ({
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  summary: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    padding: 14,
    gap: Spacing.md,
  },
  summaryRow: { flexDirection: 'row', gap: Spacing.md },
  card: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  item: { paddingBottom: Spacing.xs },
  divider: { borderTopWidth: 1, borderTopColor: c.border },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 68,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  pressed: { backgroundColor: c.surface },
  tile: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: c.iconTile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 3 },
  right: { alignItems: 'flex-end', gap: 4 },
  rightText: { textAlign: 'right' },
  badge: { alignSelf: 'flex-end' },
  action: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
}));
