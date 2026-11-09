import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { BottomSheet, DatePickerSheet, FormError, Text, TextField } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { PickerField } from '@/features/categories/components/DefinitionKit';
import { enumLabel, type Currency } from '@/lib/domain/enums';
import { formatDisplayDate, todayIso } from '@/lib/format/period';
import { toast } from '@/stores/toastStore';

import { parseRateInput, sanitizeRateInput } from '../current';
import { useSaveExchangeRate } from '../hooks';

/**
 * Elle kur girişi (ExchangeRates.Create). Aynı birim ve tarih için kayıt varsa backend günceller.
 * Çeyrek altında 1 adedin TL fiyatı girilir.
 */
export function RateEntrySheet({
  currency,
  onClose,
}: {
  currency: Currency | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const save = useSaveExchangeRate();
  const [raw, setRaw] = useState('');
  const [date, setDate] = useState(todayIso());
  const [dateOpen, setDateOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  // Her açılışta alanlar sıfırlanır (render sırasında türetilen durum).
  const [openFor, setOpenFor] = useState<Currency | null>(null);
  if (currency !== openFor) {
    setOpenFor(currency);
    setRaw('');
    setDate(todayIso());
    setError(undefined);
  }

  const submit = () => {
    if (!currency) return;
    const rate = parseRateInput(raw);
    if (rate === null) return setError('validation.required');
    if (rate <= 0) return setError('validation.positive');
    save.mutate(
      { currency, rate, date },
      {
        onSuccess: () => {
          toast.success(t('exchangeRates.saved'));
          close();
        },
      },
    );
  };

  const label = currency === 'QuarterGold' ? t('exchangeRates.goldPrice') : t('exchangeRates.rate');

  const close = () => {
    save.reset();
    onClose();
  };

  return (
    <BottomSheet
      visible={currency !== null}
      onClose={close}
      title={
        currency
          ? t('exchangeRates.entryTitle', { currency: enumLabel('currency', currency) })
          : undefined
      }
      actionLabel={t('common.save')}
      onAction={submit}
      actionLoading={save.isPending}
    >
      <View style={styles.content}>
        <FormError messages={save.error?.messages} />
        <PickerField
          label={t('exchangeRates.date')}
          value={formatDisplayDate(date)}
          icon="calendar-today"
          onPress={() => setDateOpen(true)}
        />
        <TextField
          label={label}
          value={raw ? `₺${raw}` : ''}
          placeholder="₺0,0000"
          onChangeText={(text) => {
            setRaw(sanitizeRateInput(text.replace('₺', '')));
            setError(undefined);
          }}
          keyboardType="decimal-pad"
          autoFocus
          error={error}
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        <Text variant="caption" muted>
          {t('exchangeRates.manualHint')}
        </Text>
      </View>
      <DatePickerSheet
        visible={dateOpen}
        onClose={() => setDateOpen(false)}
        value={date}
        maxDate={todayIso()}
        title={t('exchangeRates.date')}
        onSelect={setDate}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.md },
});
