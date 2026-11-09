import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Icon, SwipeableRow, Text } from '@/components/ui';
import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { formatMoney } from '@/lib/format/money';

import { categoryIcon } from '../icons';
import type { Expense } from '../types';

export interface ExpenseRowProps {
  expense: Expense;
  /** Yalnızca izin varsa verilir; yoksa satır kaymaz / dokunulmaz. */
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Harcama satırı: kategori ikonu, açıklama (yoksa kategori), kişi · ödeme aracı, yemek kartı etiketi, tutar.
 * Sola kaydırınca Düzenle / Sil (izne göre); dokununca düzenleme.
 */
export function ExpenseRow({ expense, onEdit, onDelete }: ExpenseRowProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const isMealCard = expense.paymentMethodType === 'MealCard';
  const title = expense.description || expense.categoryName;
  const meta = [
    expense.description ? expense.categoryName : null,
    expense.ownerPersonName,
    isMealCard ? null : expense.paymentMethodName,
  ]
    .filter(Boolean)
    .join(' · ');
  const amount = formatMoney(expense.amount);
  const a11yLabel = [title, meta, isMealCard ? t('expenses.mealCard') : null, amount].filter(Boolean).join(', ');

  const content = (
    <View style={[styles.row, styles.divider]}>
      <View style={styles.tile}>
        <Icon name={categoryIcon(expense.categoryName)} size={22} color={colors.iconTileText} />
      </View>
      <View style={styles.texts}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.metaRow}>
          {meta ? (
            <Text variant="caption" muted numberOfLines={1} style={styles.meta}>
              {meta}
            </Text>
          ) : null}
          {isMealCard ? <Badge variant="info" label={t('expenses.mealCard')} style={styles.tag} /> : null}
        </View>
      </View>
      <Text variant="bodyStrong" tabular>
        {amount}
      </Text>
    </View>
  );

  return (
    <SwipeableRow onEdit={onEdit} onDelete={onDelete}>
      {onEdit ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={a11yLabel}
          accessibilityHint={t('expenses.list.editHint')}
          onPress={onEdit}
          style={({ pressed }) => [styles.bg, pressed && styles.pressed]}
        >
          {content}
        </Pressable>
      ) : (
        <View accessible accessibilityLabel={a11yLabel} style={styles.bg}>
          {content}
        </View>
      )}
    </SwipeableRow>
  );
}

const useStyles = makeStyles((c) => ({
  bg: { backgroundColor: c.card },
  pressed: { backgroundColor: c.surface },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 68, paddingHorizontal: 20, paddingVertical: Spacing.sm },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  tile: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: c.iconTile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, minWidth: 0, gap: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { flexShrink: 1 },
  tag: { paddingVertical: 1, paddingHorizontal: 6 },
}));
