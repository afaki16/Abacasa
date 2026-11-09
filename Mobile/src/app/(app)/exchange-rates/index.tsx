import { Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';

import { Card, ConfirmDialog, ErrorState, Icon, ListItem, Skeleton, Text } from '@/components/ui';
import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { SectionLabel } from '@/features/categories/components/DefinitionKit';
import { DASHBOARD_PERMISSIONS } from '@/features/dashboard/constants';
import { useDashboard } from '@/features/dashboard/hooks';
import { DEBT_PERMISSIONS } from '@/features/debts/constants';
import { useDebtSummary } from '@/features/debts/hooks';
import { RateCard } from '@/features/exchangeRates/components/RateCard';
import { RateEntrySheet } from '@/features/exchangeRates/components/RateEntrySheet';
import { EXCHANGE_RATE_PERMISSIONS } from '@/features/exchangeRates/constants';
import { buildRateCards, formatRate } from '@/features/exchangeRates/current';
import { useDeleteExchangeRate, useExchangeRates } from '@/features/exchangeRates/hooks';
import type { CurrentRate, ExchangeRate } from '@/features/exchangeRates/types';
import { enumLabel, type Currency } from '@/lib/domain/enums';
import { formatDisplayDate, monthRange, todayIso } from '@/lib/format/period';
import { toast } from '@/stores/toastStore';

/**
 * Döviz kurları: USD, EUR ve çeyrek altının güncel kuru (kaynak TCMB / Elle), elle giriş, merkez bankasına
 * dönüş (elle kaydı silmek) ve elle girilen son kurlar. Güncel kurlar dönem özetinden (yoksa borç özetinden)
 * okunur; ikisine de izin yoksa elle girilen son kur gösterilir.
 */
export default function ExchangeRatesScreen() {
  return (
    <RequirePermission permission={EXCHANGE_RATE_PERMISSIONS.READ}>
      <ExchangeRatesSource />
    </RequirePermission>
  );
}

/** Hook'lar koşullu çağrılamaz; güncel kurların kaynağı izne göre ayrı bileşende okunur. */
function ExchangeRatesSource() {
  const canDashboard = useHasPermission(DASHBOARD_PERMISSIONS.READ);
  const canDebts = useHasPermission(DEBT_PERMISSIONS.READ);
  if (canDashboard) return <FromDashboard />;
  if (canDebts) return <FromDebts />;
  return (
    <ExchangeRates current={undefined} currentPending={false} onRefreshCurrent={() => undefined} />
  );
}

function FromDashboard() {
  const today = todayIso();
  const query = useDashboard(
    monthRange(Number(today.slice(0, 4)), Number(today.slice(5, 7))),
    today,
  );
  return (
    <ExchangeRates
      current={query.data?.debts.rates}
      currentPending={query.isPending}
      onRefreshCurrent={() => void query.refetch()}
    />
  );
}

function FromDebts() {
  const query = useDebtSummary();
  return (
    <ExchangeRates
      current={query.data?.rates}
      currentPending={query.isPending}
      onRefreshCurrent={() => void query.refetch()}
    />
  );
}

function ExchangeRates({
  current,
  currentPending,
  onRefreshCurrent,
}: {
  current: CurrentRate[] | undefined;
  currentPending: boolean;
  onRefreshCurrent: () => void;
}) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const manual = useExchangeRates();
  const remove = useDeleteExchangeRate();
  const canCreate = useHasPermission(EXCHANGE_RATE_PERMISSIONS.CREATE);
  const canDelete = useHasPermission(EXCHANGE_RATE_PERMISSIONS.DELETE);
  const [entry, setEntry] = useState<Currency | null>(null);
  const [toDelete, setToDelete] = useState<{ record: ExchangeRate; revert: boolean } | null>(null);

  const cards = buildRateCards(current, manual.data ?? []);
  const history = manual.data ?? [];

  const confirmDelete = () => {
    if (!toDelete) return;
    remove.mutate(toDelete.record.id, {
      onSuccess: () => {
        setToDelete(null);
        toast.success(toDelete.revert ? t('exchangeRates.reverted') : t('exchangeRates.deleted'));
      },
      onError: (e) => {
        setToDelete(null);
        toast.error(e.message);
      },
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t('exchangeRates.title') }} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={manual.isRefetching}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.background}
            onRefresh={() => {
              void manual.refetch();
              onRefreshCurrent();
            }}
          />
        }
      >
        <View style={styles.today}>
          <Icon name="today" size={20} color={colors.textMuted} />
          <Text variant="bodyStrong">
            {t('exchangeRates.currentTitle', { date: formatDisplayDate(todayIso()) })}
          </Text>
        </View>

        {manual.isPending || currentPending ? (
          [0, 1, 2].map((i) => <Skeleton key={i} height={112} radius={Radius.lg} />)
        ) : manual.isError ? (
          <ErrorState
            title={t('common.error')}
            message={manual.error.message}
            actionLabel={t('common.retry')}
            onAction={() => void manual.refetch()}
          />
        ) : (
          <>
            {cards.map((model) => {
              const record =
                model.manualId !== null ? history.find((r) => r.id === model.manualId) : undefined;
              return (
                <RateCard
                  key={model.currency}
                  model={model}
                  onManualEntry={canCreate ? () => setEntry(model.currency) : undefined}
                  onRevert={
                    canDelete && record ? () => setToDelete({ record, revert: true }) : undefined
                  }
                />
              );
            })}
            <Text variant="caption" muted style={styles.note}>
              {t('exchangeRates.manualHint')}
            </Text>

            <View style={styles.group}>
              <SectionLabel>{t('exchangeRates.historyTitle')}</SectionLabel>
              {history.length === 0 ? (
                <Card>
                  <Text variant="caption" muted>
                    {t('exchangeRates.historyEmpty')}
                  </Text>
                </Card>
              ) : (
                <Card padded={false}>
                  {history.map((r, i) => (
                    <ListItem
                      key={r.id}
                      title={enumLabel('currency', r.currency)}
                      subtitle={formatDisplayDate(r.date)}
                      amount={formatRate(r.rate, r.currency)}
                      last={i === history.length - 1}
                      trailing={
                        canDelete ? (
                          <Icon name="delete-outline" size={20} color={colors.danger} />
                        ) : undefined
                      }
                      accessibilityHint={canDelete ? t('exchangeRates.deleteHint') : undefined}
                      onPress={
                        canDelete ? () => setToDelete({ record: r, revert: false }) : undefined
                      }
                    />
                  ))}
                </Card>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <RateEntrySheet currency={entry} onClose={() => setEntry(null)} />
      <ConfirmDialog
        visible={!!toDelete}
        title={toDelete?.revert ? t('exchangeRates.revertTitle') : t('exchangeRates.deleteTitle')}
        message={
          toDelete
            ? t(toDelete.revert ? 'exchangeRates.revertMessage' : 'exchangeRates.deleteMessage', {
                currency: enumLabel('currency', toDelete.record.currency),
                date: formatDisplayDate(toDelete.record.date),
              })
            : undefined
        }
        confirmLabel={toDelete?.revert ? t('exchangeRates.revertConfirm') : t('common.delete')}
        destructive
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.background },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  today: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    minHeight: 56,
  },
  note: { paddingHorizontal: Spacing.xs, fontSize: 13, lineHeight: 20 },
  group: { gap: 6 },
}));
