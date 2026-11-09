import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AmountField, BottomSheet, DatePickerSheet, FormError, SelectSheet, Text } from '@/components/ui';
import { makeStyles, Spacing } from '@/constants/theme';
import { useHasPermission } from '@/features/auth/permissions';
import { PAYMENT_METHOD_PERMISSIONS } from '@/features/paymentMethods/constants';
import { usePaymentMethodOptions } from '@/features/paymentMethods/hooks';
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
 * ödeme tarihi. Ödeme aracı planınkiyle gelir; değiştirilirse yalnızca bu ödeme o araçla kaydedilir (plan
 * değişmez). Ödeme araçlarını görme izni yoksa planın aracı salt okunur gösterilir.
 */
export function PaySheet({ occurrence, onClose, onSubmit, pending, error }: PaySheetProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayIso());
  const [dateOpen, setDateOpen] = useState(false);
  const [amountError, setAmountError] = useState<string | undefined>();
  const [methodId, setMethodId] = useState<number | null>(null);
  const [methodOpen, setMethodOpen] = useState(false);
  const canPickMethod = useHasPermission(PAYMENT_METHOD_PERMISSIONS.READ);
  const methods = usePaymentMethodOptions();
  const activeMethods = (methods.data ?? []).filter((m) => m.isActive || m.id === occurrence?.paymentMethodId);
  const selectedMethodName =
    activeMethods.find((m) => m.id === methodId)?.name ?? occurrence?.paymentMethodName;

  // Her açılışta vadenin değerleriyle başla (render sırasında türetilen durum).
  const [shownKey, setShownKey] = useState<string | null>(null);
  const key = occurrence ? `${occurrence.recurringPaymentId}-${occurrence.month}` : null;
  if (key !== shownKey) {
    setShownKey(key);
    if (occurrence) {
      setAmount(amountToInput(occurrence.amount, 'TRY'));
      setDate(todayIso());
      setAmountError(undefined);
      setMethodId(occurrence.paymentMethodId);
    }
  }

  const server = splitFieldErrors(error, ['amount', 'date', 'paymentMethodId'] as const);

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
    onSubmit({
      month: occurrence.month,
      amount: value,
      date,
      // Yalnızca planınkinden farklıysa gönderilir.
      ...(methodId !== null && methodId !== occurrence.paymentMethodId ? { paymentMethodId: methodId } : {}),
    });
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
        visible={!!occurrence && !dateOpen && !methodOpen}
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
        {canPickMethod ? (
          <PickerField
            label={t('recurring.fields.paymentMethod')}
            value={selectedMethodName}
            icon="credit-card"
            onPress={() => setMethodOpen(true)}
            error={server.fields.paymentMethodId}
          />
        ) : (
          <PickerField
            label={t('recurring.fields.paymentMethod')}
            value={occurrence?.paymentMethodName}
            disabled
            hint={t('recurring.pay.methodHint')}
          />
        )}
      </BottomSheet>
      <SelectSheet
        visible={methodOpen}
        title={t('recurring.fields.paymentMethod')}
        options={activeMethods.map((m) => ({ value: m.id, label: m.name }))}
        value={methodId}
        onClose={() => setMethodOpen(false)}
        onSelect={(value) => setMethodId(value)}
      />
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
