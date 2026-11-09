import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { BottomSheet, Button, Chip, Text } from '@/components/ui';
import { makeStyles, Spacing } from '@/constants/theme';
import { useHasPermission } from '@/features/auth/permissions';
import { CATEGORY_PERMISSIONS } from '@/features/categories/constants';
import { useCategoryOptions } from '@/features/categories/hooks';
import { PAYMENT_METHOD_PERMISSIONS } from '@/features/paymentMethods/constants';
import { usePaymentMethodOptions } from '@/features/paymentMethods/hooks';
import { PERSON_PERMISSIONS } from '@/features/people/constants';
import { usePersonOptions } from '@/features/people/hooks';
import type { Period } from '@/lib/format/period';
import { plural } from '@/lib/i18n';

import { useExpenseSummary } from '../hooks';

export interface NamedRef {
  id: number;
  name: string;
}

/** Liste süzgeçleri; ad, etkin süzgeç çipinde gösterilir. */
export interface ExpenseFilterValues {
  category: NamedRef | null;
  paymentMethod: NamedRef | null;
  person: NamedRef | null;
}

export const EMPTY_FILTERS: ExpenseFilterValues = { category: null, paymentMethod: null, person: null };

export function hasActiveFilters(f: ExpenseFilterValues): boolean {
  return !!(f.category || f.paymentMethod || f.person);
}

export interface ExpenseFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  value: ExpenseFilterValues;
  onApply: (value: ExpenseFilterValues) => void;
  /** Sayaç için listenin dönemi ve araması. */
  period: Period;
  searchTerm?: string;
}

/**
 * Filtrele alttan sayfası: kategori, ödeme aracı ve kişi çipleri (her grupta tek seçim), "Temizle" ve
 * seçimin kayıt sayısını gösteren "N kaydı göster". Tanımı görme izni olmayan grup görünmez.
 */
export function ExpenseFilterSheet({ visible, onClose, value, onApply, period, searchTerm }: ExpenseFilterSheetProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const [draft, setDraft] = useState(value);
  const canCategories = useHasPermission(CATEGORY_PERMISSIONS.READ);
  const canPaymentMethods = useHasPermission(PAYMENT_METHOD_PERMISSIONS.READ);
  const canPeople = useHasPermission(PERSON_PERMISSIONS.READ);

  // Her açılışta uygulanmış süzgeçlerden başla (render sırasında türetilen durum).
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft(value);
  }

  const toggle = (key: keyof ExpenseFilterValues, ref: NamedRef) =>
    setDraft((d) => ({ ...d, [key]: d[key]?.id === ref.id ? null : ref }));

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text accessibilityRole="header" variant="h2" style={styles.title}>
          {t('expenses.filter.title')}
        </Text>
        <Button variant="ghost" title={t('expenses.filter.clear')} onPress={() => setDraft(EMPTY_FILTERS)} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.groups}>
        {canCategories ? <CategoryGroup selected={draft.category?.id} onToggle={(r) => toggle('category', r)} /> : null}
        {canPaymentMethods ? (
          <PaymentMethodGroup selected={draft.paymentMethod?.id} onToggle={(r) => toggle('paymentMethod', r)} />
        ) : null}
        {canPeople ? <PersonGroup selected={draft.person?.id} onToggle={(r) => toggle('person', r)} /> : null}
      </ScrollView>
      <View style={styles.apply}>
        <CountedButton
          draft={draft}
          period={period}
          searchTerm={searchTerm}
          onPress={() => {
            onApply(draft);
            onClose();
          }}
        />
      </View>
    </BottomSheet>
  );
}

/** "42 kaydı göster": taslak süzgeçlerle aynı özet ucu (sayfa açıkken). */
function CountedButton({
  draft,
  period,
  searchTerm,
  onPress,
}: {
  draft: ExpenseFilterValues;
  period: Period;
  searchTerm?: string;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const summary = useExpenseSummary({
    period,
    searchTerm,
    categoryId: draft.category?.id,
    paymentMethodId: draft.paymentMethod?.id,
    ownerPersonId: draft.person?.id,
  });
  const count = summary.data?.count;
  return (
    <Button
      title={count === undefined ? t('expenses.filter.show') : plural('expenses.filter.showCount', count)}
      onPress={onPress}
    />
  );
}

function ChipGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: NamedRef[];
  selected: number | undefined;
  onToggle: (ref: NamedRef) => void;
}) {
  const styles = useStyles();
  if (options.length === 0) return null;
  return (
    <View style={styles.group}>
      <Text variant="label" muted style={styles.groupTitle}>
        {title}
      </Text>
      <View style={styles.chips}>
        {options.map((o) => (
          <Chip key={o.id} label={o.name} selected={selected === o.id} onPress={() => onToggle(o)} />
        ))}
      </View>
    </View>
  );
}

function CategoryGroup({ selected, onToggle }: { selected?: number; onToggle: (r: NamedRef) => void }) {
  const { t } = useTranslation();
  const query = useCategoryOptions();
  return (
    <ChipGroup
      title={t('expenses.filter.category')}
      options={(query.data ?? []).map((c) => ({ id: c.id, name: c.name }))}
      selected={selected}
      onToggle={onToggle}
    />
  );
}

function PaymentMethodGroup({ selected, onToggle }: { selected?: number; onToggle: (r: NamedRef) => void }) {
  const { t } = useTranslation();
  const query = usePaymentMethodOptions();
  return (
    <ChipGroup
      title={t('expenses.filter.paymentMethod')}
      // Pasif araçların geçmiş harcamaları da süzülebilsin diye hepsi listelenir.
      options={(query.data ?? []).map((m) => ({ id: m.id, name: m.name }))}
      selected={selected}
      onToggle={onToggle}
    />
  );
}

function PersonGroup({ selected, onToggle }: { selected?: number; onToggle: (r: NamedRef) => void }) {
  const { t } = useTranslation();
  const query = usePersonOptions();
  return (
    <ChipGroup
      title={t('expenses.filter.person')}
      options={(query.data ?? []).map((p) => ({ id: p.id, name: p.name }))}
      selected={selected}
      onToggle={onToggle}
    />
  );
}

const useStyles = makeStyles(() => ({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -Spacing.sm },
  title: { fontSize: 18, lineHeight: 24 },
  scroll: { flexGrow: 0 },
  groups: { gap: Spacing.lg, paddingVertical: Spacing.md },
  group: { gap: 10 },
  groupTitle: { fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  apply: { paddingTop: Spacing.xs },
}));
