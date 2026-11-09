import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AmountField, BottomSheet, DatePickerSheet, FormError, Text } from '@/components/ui';
import { makeStyles, Spacing } from '@/constants/theme';
import type { ApiError } from '@/lib/api';
import { amountToInput, parseAmountInput } from '@/lib/format/amountInput';
import { formatDisplayDate, formatShortDate, todayIso } from '@/lib/format/period';

import { splitFieldErrors } from '../formErrors';
import type { PayRecurringPaymentRequest, RecurringPaymentOccurrence } from '../types';
import { PickerField } from './form/PickerField';

export interface PaySheetProps {
  /** Ödenecek vade; null iken kapalı. */
  occurrence: RecurringPaymentOccurrence | null;
  onClose: () => void;
  onSubmit: (request: PayRecurringPaymentRequest) => void;
  pending: boolean;
  error: ApiError | null;
}

/**
 * "Ödendi olarak işaretle" alttan sayfası: tutar (vadenin tutarıyla dolar; belli değilse girilir) ve
 * ödeme tarihi. Ödeme aracı planınkidir (istekte gönderilmez), bilgi olarak gösterilir.
 */
export function PaySheet({ occurrence, onClose, onSubmit, pending, error }: PaySheetProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayIso());
  const [dateOpen, setDateOpen] = useState(false);
  const [amountError, setAmountError] = useState<string | undefined>();

  // Her açılışta vadenin değerleriyle başla (render sırasında türetilen durum).
  const [shownKey, setShownKey] = useState<string | null>(null);
  const key = occurrence ? `${occurrence.recurringPaymentId}-${occurrence.month}` : null;
  if (key !== shownKey) {
    setShownKey(key);
    if (occurrence) {
      setAmount(amountToInput(occurrence.amount, 'TRY'));
      setDate(todayIso());
      setAmountError(undefined);
    }
  }

  const server = splitFieldErrors(error, ['amount', 'date'] as const);

  const submit = () => {
    if (!occurrence) return;
    const value = parseAmountInput(amount);
    if (value === null) {
      setAmountError('validation.required');
      return;
    }
    if (value <= 0) {
      setAmountError('validation.positive');
      return;
    }
    setAmountError(undefined);
    onSubmit({ month: occurrence.month, amount: value, date });
  };

  const subtitle = occurrence
    ? [
        t('recurring.occurrence.due', { date: formatShortDate(occurrence.dueDate) }),
        occurrence.amount == null ? t('recurring.pay.amountWasUnknown') : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <>
      <BottomSheet
        visible={!!occurrence && !dateOpen}
        onClose={onClose}
        actionLabel={t('recurring.pay.submit')}
        onAction={submit}
        actionLoading={pending}
      >
        <View style={styles.header}>
          <Text variant="h2">{occurrence?.name ?? ''}</Text>
          <Text variant="label" muted>
            {subtitle}
          </Text>
        </View>
        <FormError messages={server.rest.length ? server.rest : undefined} />
        <View style={styles.field}>
          <Text variant="label" muted>
            {t('recurring.pay.amount')}
          </Text>
          <AmountField
            variant="inline"
            currency="TRY"
            label={t('recurring.pay.amount')}
            value={amount}
            onChangeValue={(raw) => {
              setAmount(raw);
              if (amountError) setAmountError(undefined);
            }}
            error={amountError ?? server.fields.amount}
            autoFocus={occurrence?.amount == null}
          />
        </View>
        <PickerField
          label={t('recurring.pay.date')}
          value={formatDisplayDate(date)}
          icon="calendar-month"
          onPress={() => setDateOpen(true)}
          error={server.fields.date}
        />
        <PickerField
          label={t('recurring.fields.paymentMethod')}
          value={occurrence?.paymentMethodName}
          disabled
          hint={t('recurring.pay.methodHint')}
        />
      </BottomSheet>
      <DatePickerSheet
        visible={dateOpen}
        value={date}
        title={t('recurring.pay.date')}
        onClose={() => setDateOpen(false)}
        onSelect={(value) => {
          setDate(value);
          setDateOpen(false);
        }}
      />
    </>
  );
}

const useStyles = makeStyles(() => ({
  header: { gap: 2, paddingHorizontal: Spacing.xs },
  field: { gap: 6 },
}));
