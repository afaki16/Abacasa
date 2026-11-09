import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import {
  AmountField,
  Badge,
  Button,
  DatePickerSheet,
  FormError,
  FormField,
  Icon,
  SelectSheet,
  Text,
  type IconName,
  type SelectOption,
} from '@/components/ui';
import { FontFamily, makeStyles, Radius, Spacing, useColorSchemeName, useColors } from '@/constants/theme';
import { translateMessage } from '@/features/auth/validation';
import { useCategoryOptions } from '@/features/categories/hooks';
import { usePaymentMethodOptions } from '@/features/paymentMethods/hooks';
import { usePersonOptions } from '@/features/people/hooks';
import { isApiError } from '@/lib/api';
import { enumLabel } from '@/lib/domain/enums';
import { formatDisplayDate, todayIso } from '@/lib/format/period';

import {
  DESCRIPTION_MAX,
  emptyExpenseValues,
  expenseFormSchema,
  expenseToValues,
  mapServerErrors,
  valuesToRequest,
  type ExpenseFormValues,
} from '../form';
import { categoryIcon, paymentMethodIcon } from '../icons';
import type { CreateExpenseRequest, Expense } from '../types';
import { SelectField } from './SelectField';

/** Kişi seçicide "hane" seçeneği (ownerPersonId = null). */
const HOUSEHOLD = 0;

type SheetName = 'date' | 'category' | 'paymentMethod' | 'person';

export interface ExpenseFormProps {
  /**
   * quick: hızlı giriş (büyük tutar + satır listesi, yan yana iki düğme) — yeni harcama.
   * full: klasik form (alanlar alt alta) — düzenleme.
   */
  variant: 'quick' | 'full';
  /** Düzenlemede mevcut kayıt. */
  expense?: Expense;
  /** İsteği gönderir; ApiError fırlatırsa alan hataları forma işlenir. */
  onSave: (request: CreateExpenseRequest) => Promise<unknown>;
  /** Başarılı kayıttan sonra. andNew: "Kaydet ve yeni ekle" (yeni kayıtta form tarih/kategori/araç/kişi korunarak boşalır). */
  onSaved: (andNew: boolean) => void;
}

/** Harcama ekle / düzenle formu. Harcamalar yalnızca TL'dir; para birimi çipi salt gösterim. */
export function ExpenseForm({ variant, expense, onSave, onSaved }: ExpenseFormProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const today = todayIso();
  const [sheet, setSheet] = useState<SheetName | null>(null);
  const [saving, setSaving] = useState<'save' | 'saveNew' | null>(null);
  const [formError, setFormError] = useState<string[]>([]);

  const categories = useCategoryOptions();
  const paymentMethods = usePaymentMethodOptions();
  const people = usePersonOptions();

  const { control, handleSubmit, setValue, setError, reset, clearErrors } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: expense ? expenseToValues(expense) : emptyExpenseValues(today),
  });
  const [date, categoryId, paymentMethodId, ownerPersonId] = useWatch({
    control,
    name: ['date', 'categoryId', 'paymentMethodId', 'ownerPersonId'],
  });

  // Seçenekler (pasif ödeme aracı yeni kayıtta seçilemez; düzenlenen kaydınki listede kalır).
  const categoryOptions: SelectOption<number>[] = (categories.data ?? []).map((c) => ({
    value: c.id,
    label: c.name,
    icon: categoryIcon(c.name),
  }));
  const paymentMethodOptions: SelectOption<number>[] = (paymentMethods.data ?? [])
    .filter((m) => m.isActive || m.id === expense?.paymentMethodId)
    .map((m) => ({
      value: m.id,
      label: m.name,
      description: [enumLabel('paymentMethodType', m.type), m.bank, m.ownerPersonName].filter(Boolean).join(' · '),
      icon: paymentMethodIcon(m.type),
    }));
  const personOptions: SelectOption<number>[] = [
    { value: HOUSEHOLD, label: t('expenses.form.household'), icon: 'home' },
    ...(people.data ?? []).map((p) => ({
      value: p.id,
      label: p.name,
      description: p.relation ?? undefined,
      icon: 'person' as IconName,
    })),
  ];

  const categoryLabel =
    categories.data?.find((c) => c.id === categoryId)?.name ??
    (expense && expense.categoryId === categoryId ? expense.categoryName : null);
  const selectedMethod = paymentMethods.data?.find((m) => m.id === paymentMethodId);
  const methodLabel =
    selectedMethod?.name ?? (expense && expense.paymentMethodId === paymentMethodId ? expense.paymentMethodName : null);
  const methodType =
    selectedMethod?.type ?? (expense && expense.paymentMethodId === paymentMethodId ? expense.paymentMethodType : null);
  const isMealCard = methodType === 'MealCard';
  const personLabel =
    ownerPersonId === null
      ? t('expenses.form.household')
      : (people.data?.find((p) => p.id === ownerPersonId)?.name ??
        (expense && expense.ownerPersonId === ownerPersonId ? expense.ownerPersonName : null));
  const dateLabel = date === today ? `${t('common.today')} · ${formatDisplayDate(date)}` : formatDisplayDate(date);

  const pick = (name: 'categoryId' | 'paymentMethodId' | 'ownerPersonId', value: number | null) => {
    setValue(name, value, { shouldDirty: true });
    clearErrors(name);
  };

  const submit = (andNew: boolean) =>
    handleSubmit(async (values) => {
      setSaving(andNew ? 'saveNew' : 'save');
      setFormError([]);
      try {
        await onSave(valuesToRequest(values));
        if (andNew && !expense) {
          reset(emptyExpenseValues(today, values));
        }
        onSaved(andNew);
      } catch (error) {
        if (isApiError(error)) {
          const { fields, rest } = mapServerErrors(error.fieldErrors);
          fields.forEach((f) => setError(f.name, { message: f.message }));
          setFormError(rest.length > 0 ? rest : fields.length > 0 ? [] : [error.message]);
        } else {
          setFormError([t('common.error')]);
        }
      } finally {
        setSaving(null);
      }
    })();

  const amountField = (
    <Controller
      control={control}
      name="amount"
      render={({ field, fieldState }) => (
        <AmountField
          value={field.value}
          onChangeValue={field.onChange}
          currency="TRY"
          variant={variant === 'quick' ? 'hero' : 'inline'}
          autoFocus={variant === 'quick' && !expense}
          error={fieldState.error?.message}
        />
      )}
    />
  );

  const mealCardBadge = isMealCard ? <Badge variant="info" label={t('expenses.form.mealCardHint')} /> : null;

  const sheets = (
    <>
      <DatePickerSheet
        visible={sheet === 'date'}
        onClose={() => setSheet(null)}
        value={date}
        onSelect={(v) => {
          setValue('date', v, { shouldDirty: true });
          clearErrors('date');
        }}
        title={t('expenses.form.date')}
      />
      <SelectSheet
        visible={sheet === 'category'}
        onClose={() => setSheet(null)}
        title={t('expenses.form.category')}
        options={categoryOptions}
        value={categoryId}
        onSelect={(v) => pick('categoryId', v)}
        emptyText={categories.isError ? categories.error.message : t('expenses.form.noCategories')}
      />
      <SelectSheet
        visible={sheet === 'paymentMethod'}
        onClose={() => setSheet(null)}
        title={t('expenses.form.paymentMethod')}
        options={paymentMethodOptions}
        value={paymentMethodId}
        onSelect={(v) => pick('paymentMethodId', v)}
        emptyText={paymentMethods.isError ? paymentMethods.error.message : t('expenses.form.noPaymentMethods')}
      />
      <SelectSheet
        visible={sheet === 'person'}
        onClose={() => setSheet(null)}
        title={t('expenses.form.person')}
        options={personOptions}
        value={ownerPersonId ?? HOUSEHOLD}
        onSelect={(v) => pick('ownerPersonId', v === HOUSEHOLD ? null : v)}
      />
    </>
  );

  if (variant === 'quick') {
    return (
      <View style={styles.quick}>
        {amountField}
        <FormError messages={formError} />
        <View style={styles.card}>
          <QuickRow icon="calendar-today" label={t('expenses.form.date')} value={dateLabel} onPress={() => setSheet('date')} first />
          <Controller
            control={control}
            name="categoryId"
            render={({ fieldState }) => (
              <QuickRow
                icon="category"
                label={t('expenses.form.category')}
                value={categoryLabel}
                placeholder={t('expenses.form.select')}
                error={fieldState.error?.message}
                onPress={() => setSheet('category')}
              />
            )}
          />
          <Controller
            control={control}
            name="paymentMethodId"
            render={({ fieldState }) => (
              <QuickRow
                icon="credit-card"
                label={t('expenses.form.paymentMethod')}
                value={methodLabel}
                placeholder={t('expenses.form.select')}
                error={fieldState.error?.message}
                onPress={() => setSheet('paymentMethod')}
              />
            )}
          />
          <QuickRow icon="person" label={t('expenses.form.person')} value={personLabel} onPress={() => setSheet('person')} />
          <Controller
            control={control}
            name="description"
            render={({ field, fieldState }) => (
              <DescriptionRow
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                onSubmit={() => submit(false)}
              />
            )}
          />
        </View>
        {mealCardBadge ? <View style={styles.hint}>{mealCardBadge}</View> : null}
        <View style={styles.buttonRow}>
          <Button
            title={t('expenses.form.saveAndNew')}
            variant="secondary"
            loading={saving === 'saveNew'}
            disabled={saving === 'save'}
            onPress={() => submit(true)}
            style={styles.flex}
          />
          <Button
            title={t('common.save')}
            loading={saving === 'save'}
            disabled={saving === 'saveNew'}
            onPress={() => submit(false)}
            style={styles.flex}
          />
        </View>
        {sheets}
      </View>
    );
  }

  return (
    <View style={styles.full}>
      <FormError messages={formError} />
      <View style={styles.field}>
        <Text variant="label" muted>
          {t('expenses.form.amount')}
        </Text>
        {amountField}
      </View>
      <SelectField
        label={t('expenses.form.date')}
        value={formatDisplayDate(date)}
        placeholder={t('expenses.form.select')}
        icon="calendar-month"
        onPress={() => setSheet('date')}
      />
      <Controller
        control={control}
        name="categoryId"
        render={({ fieldState }) => (
          <SelectField
            label={t('expenses.form.category')}
            value={categoryLabel}
            placeholder={t('expenses.form.select')}
            error={fieldState.error?.message}
            onPress={() => setSheet('category')}
          />
        )}
      />
      <Controller
        control={control}
        name="paymentMethodId"
        render={({ fieldState }) => (
          <SelectField
            label={t('expenses.form.paymentMethod')}
            value={methodLabel}
            placeholder={t('expenses.form.select')}
            error={fieldState.error?.message}
            labelRight={mealCardBadge}
            onPress={() => setSheet('paymentMethod')}
          />
        )}
      />
      <SelectField
        label={t('expenses.form.person')}
        value={personLabel}
        placeholder={t('expenses.form.select')}
        onPress={() => setSheet('person')}
      />
      <FormField
        control={control}
        name="description"
        label={t('expenses.form.description')}
        maxLength={DESCRIPTION_MAX}
        returnKeyType="done"
        onSubmitEditing={() => submit(false)}
      />
      <View style={styles.footer}>
        <Button
          title={saving === 'save' ? t('expenses.form.saving') : t('common.save')}
          loading={saving === 'save'}
          disabled={saving === 'saveNew'}
          onPress={() => submit(false)}
        />
        <Button
          title={t('expenses.form.saveAndNew')}
          variant="ghost"
          loading={saving === 'saveNew'}
          disabled={saving === 'save'}
          onPress={() => submit(true)}
        />
      </View>
      {sheets}
    </View>
  );
}

/** Hızlı giriş satırı: ikon, etiket, sağda değer ve ok. */
function QuickRow({
  icon,
  label,
  value,
  placeholder,
  error,
  first,
  onPress,
}: {
  icon: IconName;
  label: string;
  value?: string | null;
  placeholder?: string;
  error?: string;
  first?: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const colors = useColors();
  const message = translateMessage(error);
  return (
    <View style={!first && styles.divider}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder || ''}`}
        accessibilityHint={message}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <Icon name={icon} size={20} color={error ? colors.danger : colors.textMuted} />
        <Text style={styles.rowLabel} color={error ? colors.danger : colors.textMuted} numberOfLines={1}>
          {label}
        </Text>
        <Text
          variant="bodyStrong"
          color={value ? colors.text : error ? colors.danger : colors.placeholder}
          style={styles.rowValue}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <Icon name="chevron-right" size={20} color={colors.textDisabled} />
      </Pressable>
      {message ? (
        <View style={styles.rowError}>
          <Icon name="error" size={16} color={colors.danger} />
          <Text variant="label" color={colors.danger}>
            {message}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** Hızlı girişte açıklama satırı: satırın içinde yazılır (isteğe bağlı). */
function DescriptionRow({
  value,
  onChange,
  onBlur,
  error,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error?: string;
  onSubmit: () => void;
}) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const scheme = useColorSchemeName();
  const message = translateMessage(error);
  return (
    <View style={styles.divider}>
      <View style={styles.row}>
        <Icon name="notes" size={20} color={error ? colors.danger : colors.textMuted} />
        <Text style={styles.rowLabel} color={error ? colors.danger : colors.textMuted} numberOfLines={1}>
          {t('expenses.form.description')}
        </Text>
        <TextInput
          accessibilityLabel={t('expenses.form.description')}
          accessibilityHint={message}
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          placeholder={t('expenses.form.descriptionPlaceholder')}
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          keyboardAppearance={scheme}
          maxLength={DESCRIPTION_MAX}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          style={styles.input}
        />
      </View>
      {message ? (
        <View style={styles.rowError}>
          <Icon name="error" size={16} color={colors.danger} />
          <Text variant="label" color={colors.danger}>
            {message}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  quick: { gap: Spacing.md },
  full: { gap: 14 },
  field: { gap: 6 },
  card: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 48, paddingHorizontal: 14 },
  pressed: { backgroundColor: c.surface },
  rowLabel: { width: 96, fontFamily: FontFamily.medium, fontSize: 14, lineHeight: 20 },
  rowValue: { flex: 1, textAlign: 'right' },
  rowError: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: 14, paddingBottom: Spacing.sm },
  input: {
    flex: 1,
    minHeight: 44,
    textAlign: 'right',
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    color: c.text,
    paddingVertical: Spacing.sm,
  },
  hint: { flexDirection: 'row' },
  buttonRow: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  footer: { gap: Spacing.sm, marginTop: Spacing.sm },
}));
