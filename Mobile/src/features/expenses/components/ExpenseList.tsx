import { FlashList } from '@shopify/flash-list';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, RefreshControl, View } from 'react-native';

import { ConfirmDialog, EmptyState, ErrorState, Icon, SearchBar, Skeleton, SkeletonList, Text } from '@/components/ui';
import { FontFamily, makeStyles, MIN_TOUCH, Radius, Spacing, useColors } from '@/constants/theme';
import { useHasPermission } from '@/features/auth/permissions';
import { PeriodSheet } from '@/features/dashboard/components/PeriodSheet';
import { go, ROUTES } from '@/features/dashboard/links';
import { periodShortLabel } from '@/features/dashboard/periodSelection';
import { useSelectedPeriod } from '@/features/dashboard/periodStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { flattenPages } from '@/lib/api';
import { formatMoney } from '@/lib/format/money';
import { formatShortDate, todayIso } from '@/lib/format/period';
import { toast } from '@/stores/toastStore';

import { EXPENSE_PERMISSIONS } from '../constants';
import { groupExpensesByDay, type DayHeaderItem, type ExpenseListItem } from '../grouping';
import { useDeleteExpense, useExpenseSummary, useExpensesInfinite } from '../hooks';
import type { Expense, ExpenseFilters } from '../types';
import {
  EMPTY_FILTERS,
  ExpenseFilterSheet,
  hasActiveFilters,
  type ExpenseFilterValues,
} from './ExpenseFilterSheet';
import { ExpenseRow } from './ExpenseRow';

/**
 * Harcamalar sekmesinin içeriği (Expenses.Read): arama, dönem, süzgeçler, dönem toplamı (yemek kartı ayrı),
 * güne göre gruplu sonsuz liste. Satır sola kaydırılınca izne göre Düzenle / Sil.
 */
export function ExpenseList() {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const today = todayIso();
  const { selection, period } = useSelectedPeriod();
  const [search, setSearch] = useState('');
  const searchTerm = useDebouncedValue(search);
  const [filterValues, setFilterValues] = useState<ExpenseFilterValues>(EMPTY_FILTERS);
  const [sheet, setSheet] = useState<'period' | 'filter' | null>(null);
  const [toDelete, setToDelete] = useState<Expense | null>(null);

  const canCreate = useHasPermission(EXPENSE_PERMISSIONS.CREATE);
  const canUpdate = useHasPermission(EXPENSE_PERMISSIONS.UPDATE);
  const canDelete = useHasPermission(EXPENSE_PERMISSIONS.DELETE);

  const filters: ExpenseFilters = {
    period,
    searchTerm: searchTerm.trim() || undefined,
    categoryId: filterValues.category?.id,
    paymentMethodId: filterValues.paymentMethod?.id,
    ownerPersonId: filterValues.person?.id,
  };
  const query = useExpensesInfinite(filters);
  const summary = useExpenseSummary(filters);
  const remove = useDeleteExpense();

  const expenses = flattenPages(query.data?.pages);
  const items = groupExpensesByDay(expenses, today);
  const filtered = hasActiveFilters(filterValues) || !!filters.searchTerm;

  const confirmDelete = () => {
    if (!toDelete) return;
    remove.mutate(toDelete.id, {
      onSuccess: () => {
        setToDelete(null);
        toast.success(t('expenses.toast.deleted'));
      },
      onError: (error) => {
        setToDelete(null);
        toast.error(error.message);
      },
    });
  };

  const activeChips = (
    [
      ['category', 'expenses.filter.category'],
      ['paymentMethod', 'expenses.filter.paymentMethod'],
      ['person', 'expenses.filter.person'],
    ] as const
  ).flatMap(([key, labelKey]) => {
    const ref = filterValues[key];
    return ref ? [{ key, label: `${t(labelKey)}: ${ref.name}` }] : [];
  });

  const renderHeader = (item: DayHeaderItem) => {
    const short = formatShortDate(item.date);
    const year = item.date.slice(0, 4);
    const dateText = year === today.slice(0, 4) ? short : `${short} ${year}`;
    const label =
      item.relation === 'today'
        ? `${t('common.today')} · ${dateText}`
        : item.relation === 'yesterday'
          ? `${t('ui.datePicker.yesterday')} · ${dateText}`
          : dateText;
    return (
      <View style={styles.dayHeader} accessibilityRole="header">
        <Text variant="label" muted style={styles.dayText}>
          {label}
        </Text>
        <Text variant="label" muted tabular style={styles.dayText}>
          {formatMoney(item.total)}
        </Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: ExpenseListItem }) =>
    item.type === 'header' ? (
      renderHeader(item)
    ) : (
      <ExpenseRow
        expense={item.expense}
        onEdit={canUpdate ? () => go(ROUTES.editExpense(item.expense.id)) : undefined}
        onDelete={canDelete ? () => setToDelete(item.expense) : undefined}
      />
    );

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <View style={styles.toolbar}>
          <View style={styles.search}>
            <SearchBar value={search} onChangeText={setSearch} placeholder={t('expenses.list.searchPlaceholder')} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('expenses.list.periodButton', { period: periodShortLabel(selection) })}
            onPress={() => setSheet('period')}
            style={({ pressed }) => [styles.toolButton, pressed && styles.pressed]}
          >
            <Icon name="calendar-month" size={20} />
            <Text style={styles.toolText}>{periodShortLabel(selection)}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('expenses.filter.title')}
            accessibilityState={{ selected: hasActiveFilters(filterValues) }}
            onPress={() => setSheet('filter')}
            style={({ pressed }) => [
              styles.iconButton,
              hasActiveFilters(filterValues) && styles.iconButtonActive,
              pressed && styles.pressed,
            ]}
          >
            <Icon name="tune" size={22} color={hasActiveFilters(filterValues) ? colors.primarySoftText : colors.text} />
            {hasActiveFilters(filterValues) ? <View style={styles.dot} /> : null}
          </Pressable>
        </View>

        {selection.card ? (
          <Text variant="caption" muted>
            {t('expenses.list.cardPeriod', { card: selection.card.name })}
          </Text>
        ) : null}

        {activeChips.length > 0 ? (
          <View style={styles.chips}>
            {activeChips.map((chip) => (
              <Pressable
                key={chip.key}
                accessibilityRole="button"
                accessibilityLabel={t('expenses.filter.remove', { filter: chip.label })}
                hitSlop={{ top: 6, bottom: 6 }}
                onPress={() => setFilterValues((f) => ({ ...f, [chip.key]: null }))}
                style={({ pressed }) => [styles.activeChip, pressed && styles.pressed]}
              >
                <Text color={colors.primarySoftText} style={styles.activeChipText}>
                  {chip.label}
                </Text>
                <Icon name="close" size={18} color={colors.primarySoftText} />
              </Pressable>
            ))}
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={[
            t('expenses.list.periodTotal'),
            summary.data ? formatMoney(summary.data.total) : '',
            summary.data && summary.data.mealCardTotal > 0
              ? `${t('expenses.list.mealCardSeparate')} ${formatMoney(summary.data.mealCardTotal)}`
              : '',
          ]
            .filter(Boolean)
            .join(', ')}
          accessibilityHint={t('expenses.list.byCategoryHint')}
          onPress={() => go(ROUTES.byCategory)}
          style={({ pressed }) => [styles.totalCard, pressed && styles.pressed]}
        >
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel} muted>
              {t('expenses.list.periodTotal')}
            </Text>
            <View style={styles.totalRight}>
              {summary.data ? (
                <Text tabular style={styles.totalAmount}>
                  {formatMoney(summary.data.total)}
                </Text>
              ) : (
                <Skeleton width={110} height={18} />
              )}
              <Icon name="chevron-right" size={20} color={colors.textDisabled} />
            </View>
          </View>
          {summary.data && summary.data.mealCardTotal > 0 ? (
            <View style={styles.totalRow}>
              <Text variant="label" muted>
                {t('expenses.list.mealCardSeparate')}
              </Text>
              <Text variant="bodyStrong" muted tabular style={styles.mealAmount}>
                {formatMoney(summary.data.mealCardTotal)}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {query.isPending ? (
        <SkeletonList rows={6} />
      ) : query.isError && expenses.length === 0 ? (
        <ErrorState
          title={t('expenses.list.loadError')}
          message={query.error.message}
          actionLabel={t('common.retry')}
          onAction={() => void query.refetch()}
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.key}
          getItemType={(item) => item.type}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isFetchingNextPage}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.background}
              onRefresh={() => {
                void query.refetch();
                void summary.refetch();
              }}
            />
          }
          ListEmptyComponent={
            filtered ? (
              <EmptyState
                icon="search-off"
                tone="neutral"
                title={t('expenses.list.noResults')}
                message={t('expenses.list.noResultsMessage')}
                actionLabel={hasActiveFilters(filterValues) ? t('expenses.filter.clear') : undefined}
                actionVariant="secondary"
                onAction={() => setFilterValues(EMPTY_FILTERS)}
              />
            ) : (
              <EmptyState
                icon="receipt-long"
                title={t('expenses.list.empty')}
                message={t('expenses.list.emptyMessage')}
                actionLabel={canCreate ? t('expenses.list.add') : undefined}
                actionIcon="add"
                onAction={() => go(ROUTES.newExpense)}
              />
            )
          }
          ListFooterComponent={
            query.isFetchingNextPage ? <ActivityIndicator style={styles.footer} color={colors.primary} /> : null
          }
        />
      )}

      <PeriodSheet visible={sheet === 'period'} onClose={() => setSheet(null)} />
      <ExpenseFilterSheet
        visible={sheet === 'filter'}
        onClose={() => setSheet(null)}
        value={filterValues}
        onApply={setFilterValues}
        period={period}
        searchTerm={filters.searchTerm}
      />
      <ConfirmDialog
        visible={!!toDelete}
        title={t('expenses.delete.title')}
        message={
          toDelete
            ? t('expenses.delete.message', {
                name: toDelete.description || toDelete.categoryName,
                amount: formatMoney(toDelete.amount),
              })
            : undefined
        }
        confirmLabel={t('common.delete')}
        destructive
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1 },
  top: { paddingHorizontal: Spacing.lg, paddingBottom: 10, gap: 10 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  search: { flex: 1 },
  toolButton: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: c.fieldBorder,
    backgroundColor: c.card,
  },
  toolText: { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 20 },
  iconButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: c.fieldBorder,
    backgroundColor: c.card,
  },
  iconButtonActive: { backgroundColor: c.primarySoft, borderColor: c.primarySoft },
  dot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: c.primary },
  pressed: { opacity: 0.75 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  activeChip: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingLeft: Spacing.md,
    paddingRight: 6,
    borderRadius: Radius.full,
    backgroundColor: c.primarySoft,
  },
  activeChipText: { fontFamily: FontFamily.semibold, fontSize: 13, lineHeight: 18 },
  totalCard: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: 14,
    gap: Spacing.sm,
  },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  totalRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  totalLabel: { fontFamily: FontFamily.medium, fontSize: 14, lineHeight: 20 },
  totalAmount: { fontFamily: FontFamily.bold, fontSize: 18, lineHeight: 24 },
  mealAmount: { fontSize: 14, marginRight: 24 },
  list: { paddingBottom: Spacing.xl },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 14, paddingBottom: Spacing.sm, paddingHorizontal: 20 },
  dayText: { fontFamily: FontFamily.semibold },
  footer: { marginVertical: Spacing.lg },
}));
