import { Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';

import {
  Card,
  ConfirmDialog,
  DatePickerSheet,
  ErrorState,
  Icon,
  ListItem,
  Skeleton,
  Text,
} from '@/components/ui';
import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { SectionLabel } from '@/features/categories/components/DefinitionKit';
import { RateCard } from '@/features/exchangeRates/components/RateCard';
import { RateEntrySheet } from '@/features/exchangeRates/components/RateEntrySheet';
import { EXCHANGE_RATE_PERMISSIONS } from '@/features/exchangeRates/constants';
import { buildRateCards, formatRate, shiftIsoDate } from '@/features/exchangeRates/current';
import { useDeleteExchangeRate, useExchangeRates, useRatesAsOf } from '@/features/exchangeRates/hooks';
import type { ExchangeRate } from '@/features/exchangeRates/types';
import { enumLabel, type Currency } from '@/lib/domain/enums';
import { formatDisplayDate, todayIso } from '@/lib/format/period';
import { toast } from '@/stores/toastStore';

/**
 * Döviz kurları: USD, EUR ve çeyrek altının seçilen tarihte geçerli kuru (kaynak TCMB / Elle; varsayılan bugün,
 * tarih gezgini ile geçmiş günler), elle giriş, merkez bankasına dönüş (elle kaydı silmek) ve elle girilen son kurlar.
 */
export default function ExchangeRatesScreen() {
  return (
    <RequirePermission permission={EXCHANGE_RATE_PERMISSIONS.READ}>
      <ExchangeRatesOnDate />
    </RequirePermission>
  );
}

function ExchangeRatesOnDate() {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const today = todayIso();
  const [date, setDate] = useState(today);
  const [dateOpen, setDateOpen] = useState(false);
  const asOf = useRatesAsOf(date);
  const manual = useExchangeRates();
  const remove = useDeleteExchangeRate();
  const canCreate = useHasPermission(EXCHANGE_RATE_PERMISSIONS.CREATE);
  const canDelete = useHasPermission(EXCHANGE_RATE_PERMISSIONS.DELETE);
  const [entry, setEntry] = useState<Currency | null>(null);
  const [toDelete, setToDelete] = useState<{ record: ExchangeRate; revert: boolean } | null>(null);
  const isToday = date >= today;
  const current = asOf.data;
  const currentPending = asOf.isPending;

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
              void asOf.refetch();
            }}
          />
        }
      >
        {/* Tarih gezgini: ‹ tarih › (bugünden ileri gidilemez); tarihe dokununca takvim */}
        <View style={styles.today}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('exchangeRates.previousDay')}
            hitSlop={8}
            onPress={() => setDate(shiftIsoDate(date, -1))}
            style={styles.stepper}
          >
            <Icon name="chevron-left" size={24} color={colors.primary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityHint={t('exchangeRates.pickDate')}
            onPress={() => setDateOpen(true)}
            style={styles.dateButton}
          >
            <Icon name="today" size={20} color={colors.textMuted} />
            <Text variant="bodyStrong">
              {isToday
                ? t('exchangeRates.currentTitle', { date: formatDisplayDate(today) })
                : t('exchangeRates.asOfTitle', { date: formatDisplayDate(date) })}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('exchangeRates.nextDay')}
            accessibilityState={{ disabled: isToday }}
            disabled={isToday}
            hitSlop={8}
            onPress={() => setDate(shiftIsoDate(date, 1))}
            style={styles.stepper}
          >
            <Icon name="chevron-right" size={24} color={isToday ? colors.textDisabled : colors.primary} />
          </Pressable>
        </View>

        {manual.isPending || currentPending ? (
          [0, 1, 2].map((i) => <Skeleton key={i} height={112} radius={Radius.lg} />)
        ) : manual.isError || asOf.isError ? (
          <ErrorState
            title={t('common.error')}
            message={(manual.error ?? asOf.error)?.message}
            actionLabel={t('common.retry')}
            onAction={() => {
              void manual.refetch();
              void asOf.refetch();
            }}
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

      <RateEntrySheet currency={entry} initialDate={date} onClose={() => setEntry(null)} />
      <DatePickerSheet
        visible={dateOpen}
        onClose={() => setDateOpen(false)}
        value={date}
        maxDate={today}
        minDate="2000-01-01"
        title={t('exchangeRates.pickDate')}
        onSelect={setDate}
      />
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
    paddingHorizontal: Spacing.sm,
  },
  stepper: { padding: Spacing.xs },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: 48,
  },
  note: { paddingHorizontal: Spacing.xs, fontSize: 13, lineHeight: 20 },
  group: { gap: 6 },
}));
