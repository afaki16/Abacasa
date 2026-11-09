import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  AmountField,
  BottomSheet,
  Button,
  ConfirmDialog,
  FormError,
  Text,
  TextField,
} from '@/components/ui';
import { makeStyles, Spacing, useColors } from '@/constants/theme';
import { Labeled } from '@/features/recurringPayments/components/form/Bits';
import { DateField } from '@/features/recurringPayments/components/form/Fields';
import { splitFieldErrors } from '@/features/recurringPayments/formErrors';
import { formatAmount, formatMoney } from '@/lib/format/money';
import { formatShortDate, todayIso } from '@/lib/format/period';
import { toast } from '@/stores/toastStore';

import {
  paymentFormToRequest,
  paymentInTry,
  paymentToForm,
  sanitizeRateInput,
  validatePayment,
  type PaymentFormErrors,
  type PaymentFormValues,
} from '../debtForm';
import {
  useCreateDebtPayment,
  useDeleteDebtPayment,
  useDebtSummary,
  useUpdateDebtPayment,
} from '../hooks';
import type { DebtListItem, DebtPayment } from '../types';
import { debtTitle } from './DebtCard';

export interface PaymentSheetProps {
  visible: boolean;
  debt: DebtListItem;
  /** Düzenlenen ödeme; null ise yeni. */
  payment: DebtPayment | null;
  canDelete: boolean;
  onClose: () => void;
}

/**
 * Ödeme ekle / düzenle: tarih + tutar (çeyrekte adet), yabancı birimde kur (her zaman elle; güncel kur
 * öneri olarak dolar) ve TL karşılığı, not.
 */
export function PaymentSheet({ visible, debt, payment, canDelete, onClose }: PaymentSheetProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const summary = useDebtSummary();
  const create = useCreateDebtPayment();
  const update = useUpdateDebtPayment();
  const remove = useDeleteDebtPayment();
  const foreign = debt.currency !== 'TRY';
  const current = summary.data?.rates.find((r) => r.currency === debt.currency) ?? null;
  const [values, setValues] = useState<PaymentFormValues>(() =>
    paymentToForm(payment, debt.currency, todayIso(), current?.rate),
  );
  const [errors, setErrors] = useState<PaymentFormErrors>({});
  const [confirming, setConfirming] = useState(false);

  // Her açılışta ödemenin değerleriyle başla (render sırasında türetilen durum).
  const openKey = visible ? `open-${payment?.id ?? 'new'}` : 'closed';
  const [shownKey, setShownKey] = useState(openKey);
  if (openKey !== shownKey) {
    setShownKey(openKey);
    if (visible) {
      setValues(paymentToForm(payment, debt.currency, todayIso(), current?.rate));
      setErrors({});
      create.reset();
      update.reset();
    }
  }

  const mutation = payment ? update : create;
  const server = splitFieldErrors(mutation.error, [
    'date',
    'amount',
    'exchangeRate',
    'note',
  ] as const);
  const maxAmount = debt.remaining + (payment?.amount ?? 0);
  const inTry = foreign ? paymentInTry(values.amount, values.rate) : null;
  const set = <K extends keyof PaymentFormValues>(key: K, value: PaymentFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = () => {
    const found = validatePayment(values, {
      currency: debt.currency,
      debtDate: debt.date,
      maxAmount,
      maxText: formatAmount(maxAmount, debt.currency),
    });
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const request = paymentFormToRequest(values, debt.currency);
    const done = () => {
      toast.success(t(payment ? 'debts.toast.paymentUpdated' : 'debts.toast.paymentCreated'));
      onClose();
    };
    if (payment)
      update.mutate({ ...request, debtId: debt.id, paymentId: payment.id }, { onSuccess: done });
    else create.mutate({ ...request, debtId: debt.id }, { onSuccess: done });
  };

  const rateLabel = t('debts.payment.rateLabel', {
    currency: t(`ui.currency.short.${debt.currency}`),
  });
  const rateSource = current
    ? t('debts.payment.currentRate', {
        source: t(`debts.rateSource.${current.source}`),
        date: formatShortDate(current.date),
      })
    : null;

  return (
    <>
      <BottomSheet
        visible={visible && !confirming}
        onClose={onClose}
        actionLabel={t('debts.payment.save')}
        onAction={submit}
        actionLoading={mutation.isPending}
      >
        <View style={styles.header}>
          <Text variant="h2">
            {payment ? t('debts.payment.editTitle') : t('debts.payment.newTitle')}
          </Text>
          <Text variant="label" muted>
            {t('debts.payment.subtitle', {
              title: debtTitle(debt, t('debts.household')),
              left: formatAmount(debt.remaining, debt.currency),
            })}
          </Text>
        </View>
        <FormError messages={server.rest.length ? server.rest : undefined} />
        <DateField
          label={t('debts.fields.date')}
          value={values.date}
          onChange={(v) => set('date', v)}
          minDate={debt.date.slice(0, 10)}
          error={errors.date ?? server.fields.date}
        />
        <Labeled
          label={
            debt.currency === 'QuarterGold' ? t('debts.fields.count') : t('debts.fields.amount')
          }
        >
          <AmountField
            variant="inline"
            currency={debt.currency}
            label={t('debts.fields.amount')}
            value={values.amount}
            onChangeValue={(v) => set('amount', v)}
            error={errors.amount ?? server.fields.amount}
          />
        </Labeled>
        {foreign ? (
          <View style={styles.rate}>
            <TextField
              label={rateLabel}
              value={values.rate ? `₺${values.rate}` : ''}
              onChangeText={(text) => set('rate', sanitizeRateInput(text))}
              keyboardType="decimal-pad"
              placeholder="₺0,0000"
              error={errors.rate ?? server.fields.exchangeRate}
              hint={rateSource ?? t('debts.payment.rateHint')}
            />
            {inTry !== null ? (
              <Text variant="label" tabular color={colors.textMuted} style={styles.inTry}>
                {t('debts.payment.inTry', { amount: formatMoney(inTry) })}
              </Text>
            ) : null}
          </View>
        ) : null}
        <TextField
          label={t('donations.fields.note')}
          placeholder={t('donations.form.optional')}
          value={values.note}
          onChangeText={(v) => set('note', v)}
          maxLength={200}
          error={errors.note ?? server.fields.note}
        />
        {payment && canDelete ? (
          <Button
            title={t('debts.payment.delete')}
            variant="danger"
            onPress={() => setConfirming(true)}
          />
        ) : null}
      </BottomSheet>
      <ConfirmDialog
        visible={confirming}
        title={t('debts.payment.deleteTitle')}
        confirmLabel={t('common.delete')}
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          if (!payment) return;
          remove.mutate(
            { debtId: debt.id, paymentId: payment.id },
            {
              onSuccess: () => {
                setConfirming(false);
                toast.success(t('debts.toast.paymentDeleted'));
                onClose();
              },
              onError: (e) => {
                setConfirming(false);
                toast.error(e.message);
              },
            },
          );
        }}
      />
    </>
  );
}

const useStyles = makeStyles(() => ({
  header: { gap: 2, paddingHorizontal: Spacing.xs },
  rate: { gap: Spacing.xs },
  inTry: { textAlign: 'right' },
}));
