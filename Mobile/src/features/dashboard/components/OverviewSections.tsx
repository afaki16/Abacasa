import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Button, Icon, SegmentedControl, Skeleton, SkeletonList, Text, type IconName } from '@/components/ui';
import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { useHasPermission } from '@/features/auth/permissions';
import { EXPENSE_PERMISSIONS } from '@/features/expenses/constants';
import { useExpenseSummary } from '@/features/expenses/hooks';
import { categoryIcon, paymentMethodIcon } from '@/features/expenses/icons';
import { RECURRING_PAYMENT_PERMISSIONS } from '@/features/recurringPayments/constants';
import { VEHICLE_PERMISSIONS } from '@/features/vehicles/constants';
import { enumLabel, type RecurringPaymentKind } from '@/lib/domain/enums';
import { formatMoney } from '@/lib/format/money';
import { formatDisplayDate, type Period } from '@/lib/format/period';
import { plural } from '@/lib/i18n';

import { toBreakdownRows } from '../breakdown';
import { go, ROUTES } from '../links';
import type { Dashboard, DashboardUpcomingItem } from '../types';
import { dueInfo, upcomingKey, type DueInfo } from '../upcoming';
import { BreakdownList, type BreakdownListRow } from './BreakdownList';

/** Özette kırılım başına gösterilen satır; fazlası "Tümü" ile. */
export const BREAKDOWN_LIMIT = 5;
/** Özette gösterilen yaklaşan ödeme sayısı. */
export const UPCOMING_LIMIT = 5;

const KIND_ICONS: Record<RecurringPaymentKind, IconName> = {
  Subscription: 'subscriptions',
  Bill: 'receipt',
  Installment: 'credit-score',
  Donation: 'volunteer-activism',
};

/** "Gecikti · 2 gün" / "Bugün" / "3 gün kaldı". */
export function dueText(info: DueInfo, t: (key: string) => string): string {
  if (info.tone === 'overdue') {
    return info.days > 0 ? plural('summary.due.overdueDays', info.days) : t('summary.due.overdue');
  }
  if (info.tone === 'today') return t('common.today');
  return plural('summary.due.daysLeft', info.days);
}

export function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  const styles = useStyles();
  return (
    <View style={styles.sectionHeader}>
      <Text variant="section" accessibilityRole="header">
        {title}
      </Text>
      {actionLabel && onAction ? <Button variant="ghost" title={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

/** Yaklaşan sabit ödeme vadeleri (ödenmemiş; gecikmiş olanlar dahil). */
export function UpcomingSection({ items, today }: { items: DashboardUpcomingItem[]; today: string }) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const canOpen = useHasPermission(RECURRING_PAYMENT_PERMISSIONS.READ);

  return (
    <View style={styles.section}>
      <SectionHeader
        title={t('summary.upcoming.title')}
        actionLabel={canOpen ? t('summary.all') : undefined}
        onAction={() => go(ROUTES.recurring)}
      />
      <View style={styles.card}>
        {items.length === 0 ? (
          <Text muted style={styles.empty}>
            {t('summary.upcoming.empty')}
          </Text>
        ) : (
          items.slice(0, UPCOMING_LIMIT).map((item, index) => {
            const info = dueInfo(item, today);
            const when = dueText(info, t);
            const whenColor =
              info.tone === 'overdue' ? colors.danger : info.tone === 'today' ? colors.badges.pending.fg : colors.textMuted;
            const amount = formatMoney(item.amount);
            const row = (
              <View style={[styles.row, index > 0 && styles.divider]}>
                <View style={styles.tile}>
                  <Icon name={item.kind ? KIND_ICONS[item.kind] : 'event-repeat'} size={22} color={colors.iconTileText} />
                </View>
                <View style={styles.texts}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text variant="caption" color={whenColor} style={styles.strongCaption}>
                    {[when, item.paymentMethodName].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <View style={styles.amount}>
                  <Text variant="bodyStrong" tabular>
                    {amount}
                  </Text>
                  {item.isEstimated ? (
                    <Text variant="caption" muted>
                      {t('summary.upcoming.estimated')}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
            return canOpen ? (
              <Pressable
                key={upcomingKey(item)}
                accessibilityRole="button"
                accessibilityLabel={[item.name, when, amount].join(', ')}
                onPress={() => go(ROUTES.recurring)}
                style={({ pressed }) => pressed && styles.pressed}
              >
                {row}
              </Pressable>
            ) : (
              <View key={upcomingKey(item)} accessible accessibilityLabel={[item.name, when, amount].join(', ')}>
                {row}
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

/** Araç hatırlatmaları (muayene, sigorta, MTV); hiçbir toplama girmez. */
export function VehicleSection({ items, today }: { items: DashboardUpcomingItem[]; today: string }) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const canOpen = useHasPermission(VEHICLE_PERMISSIONS.READ);
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title={t('summary.vehicles.title')} />
      <View style={styles.card}>
        {items.map((item, index) => {
          const info = dueInfo(item, today);
          const badge = dueText(info, t);
          const variant = info.tone === 'overdue' ? 'overdue' : info.tone === 'later' ? 'neutral' : 'pending';
          const meta = formatDisplayDate(item.dueDate);
          return (
            <Pressable
              key={upcomingKey(item)}
              accessibilityRole={canOpen ? 'button' : undefined}
              accessibilityLabel={[item.name, meta, badge].join(', ')}
              disabled={!canOpen}
              onPress={() => go(ROUTES.vehicles)}
              style={({ pressed }) => [styles.row, index > 0 && styles.divider, pressed && styles.pressed]}
            >
              <View style={styles.tile}>
                <Icon name="directions-car" size={22} color={colors.iconTileText} />
              </View>
              <View style={styles.texts}>
                <Text variant="bodyStrong" numberOfLines={2}>
                  {item.name}
                </Text>
                <Text variant="caption" muted tabular>
                  {meta}
                </Text>
              </View>
              <Badge label={badge} variant={variant} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type BreakdownKind = 'category' | 'paymentMethod' | 'person';

/** Kırılımlar: kategori (harcama özeti, yemek kartı hariç), ödeme aracı (yemek kartı dahil), kişi. */
export function BreakdownSection({ data, period }: { data: Dashboard; period: Period }) {
  const { t } = useTranslation();
  const styles = useStyles();
  const canReadExpenses = useHasPermission(EXPENSE_PERMISSIONS.READ);
  const [kind, setKind] = useState<BreakdownKind>(canReadExpenses ? 'category' : 'paymentMethod');

  const segments = [
    ...(canReadExpenses ? [{ value: 'category' as const, label: t('summary.breakdown.category') }] : []),
    { value: 'paymentMethod' as const, label: t('summary.breakdown.paymentMethod') },
    { value: 'person' as const, label: t('summary.breakdown.person') },
  ];

  const pmRows: BreakdownListRow[] = toBreakdownRows(
    data.byPaymentMethod.map((r) => ({ key: `pm-${r.id}`, label: r.name, amount: r.total })),
  ).map((row) => {
    const source = data.byPaymentMethod.find((r) => `pm-${r.id}` === row.key)!;
    return {
      ...row,
      icon: paymentMethodIcon(source.type),
      caption: [
        enumLabel('paymentMethodType', source.type),
        source.pending > 0 ? t('summary.pendingAmount', { amount: formatMoney(source.pending) }) : null,
      ]
        .filter(Boolean)
        .join(' · '),
    };
  });

  const personRows: BreakdownListRow[] = toBreakdownRows(
    data.byPerson.map((r) => ({
      key: `p-${r.personId ?? 'household'}`,
      label: r.name ?? t('summary.household'),
      amount: r.total,
    })),
  ).map((row) => {
    const source = data.byPerson.find((r) => `p-${r.personId ?? 'household'}` === row.key)!;
    return {
      ...row,
      icon: source.personId === null ? 'home' : 'person',
      caption: source.pending > 0 ? t('summary.pendingAmount', { amount: formatMoney(source.pending) }) : undefined,
    };
  });

  return (
    <View style={styles.section}>
      <SectionHeader
        title={t('summary.breakdown.title')}
        actionLabel={kind === 'category' ? t('summary.all') : undefined}
        onAction={() => go(ROUTES.byCategory)}
      />
      <SegmentedControl
        segments={segments}
        value={kind}
        onChange={setKind}
        accessibilityLabel={t('summary.breakdown.title')}
      />
      {kind === 'category' ? (
        <CategoryBreakdown period={period} />
      ) : (
        <BreakdownList
          rows={(kind === 'paymentMethod' ? pmRows : personRows).slice(0, BREAKDOWN_LIMIT)}
          emptyText={t('summary.breakdown.empty')}
        />
      )}
    </View>
  );
}

/** Kategori kırılımı harcama özetinden gelir (Expenses.Read; dashboard'da kategori kırılımı yok). */
export function CategoryBreakdown({ period, limit = BREAKDOWN_LIMIT }: { period: Period; limit?: number }) {
  const { t } = useTranslation();
  const summary = useExpenseSummary({ period });
  if (summary.isPending) return <SkeletonList rows={3} card />;
  if (summary.isError) {
    return <BreakdownList rows={[]} emptyText={t('summary.breakdown.loadError')} />;
  }
  const rows = toBreakdownRows(
    summary.data.byCategory.map((c) => ({ key: `c-${c.categoryId}`, label: c.categoryName, amount: c.total })),
  ).map((row) => ({ ...row, icon: categoryIcon(row.label) }));
  return <BreakdownList rows={rows.slice(0, limit)} emptyText={t('summary.breakdown.empty')} />;
}

/** İlk yükleme iskeleti: özet kartı, iki küçük kart, liste. */
export function OverviewSkeleton() {
  const styles = useStyles();
  return (
    <View style={styles.skeleton} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Skeleton height={168} radius={Radius.xl} />
      <View style={styles.pair}>
        <Skeleton height={120} radius={Radius.lg} style={styles.flex} />
        <Skeleton height={120} radius={Radius.lg} style={styles.flex} />
      </View>
      <Skeleton height={68} radius={Radius.lg} />
      <SkeletonList rows={3} card />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  section: { gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.xs },
  card: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, paddingHorizontal: 14, minHeight: 64 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  tile: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: c.iconTile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, minWidth: 0, gap: 2 },
  strongCaption: { fontWeight: '600' },
  amount: { alignItems: 'flex-end', gap: 2 },
  pressed: { backgroundColor: c.surface },
  empty: { padding: Spacing.lg, textAlign: 'center' },
  skeleton: { gap: Spacing.md },
  pair: { flexDirection: 'row', gap: Spacing.md },
  flex: { flex: 1 },
}));

