import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  AmountField,
  BottomSheet,
  Button,
  ConfirmDialog,
  FormError,
  SegmentedControl,
  Text,
  TextField,
} from '@/components/ui';
import { makeStyles, Spacing } from '@/constants/theme';
import { Labeled } from '@/features/recurringPayments/components/form/Bits';
import { DateField } from '@/features/recurringPayments/components/form/Fields';
import { splitFieldErrors } from '@/features/recurringPayments/formErrors';
import { enumLabel, type FundMovementType } from '@/lib/domain/enums';
import { formatMoney } from '@/lib/format/money';
import { todayIso } from '@/lib/format/period';
import { toast } from '@/stores/toastStore';

import {
  movementFormToRequest,
  movementToForm,
  validateMovement,
  type MovementFormValues,
} from '../fundForm';
import { useCreateFundMovement, useDeleteFundMovement, useUpdateFundMovement } from '../hooks';
import type { FundMovement } from '../types';

export interface MovementSheetProps {
  visible: boolean;
  fundId: number;
  /** Düzenlenen hareket; null ise yeni. */
  movement: FundMovement | null;
  onHand: number;
  canDelete: boolean;
  onClose: () => void;
}

/**
 * Emanet hareketi: Kullanım (eldeki paradan geçici kullanım) ya da Yerine koyma. Bağış kaydı oluşmaz;
 * yalnızca kullanımda / elde tutarı değişir.
 */
export function MovementSheet({
  visible,
  fundId,
  movement,
  onHand,
  canDelete,
  onClose,
}: MovementSheetProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const create = useCreateFundMovement();
  const update = useUpdateFundMovement();
  const remove = useDeleteFundMovement();
  const [values, setValues] = useState<MovementFormValues>(() =>
    movementToForm(movement, todayIso()),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof MovementFormValues, string>>>({});
  const [confirming, setConfirming] = useState(false);

  // Her açılışta hareketin değerleriyle başla (render sırasında türetilen durum).
  const openKey = visible ? `open-${movement?.id ?? 'new'}` : 'closed';
  const [shownKey, setShownKey] = useState(openKey);
  if (openKey !== shownKey) {
    setShownKey(openKey);
    if (visible) {
      setValues(movementToForm(movement, todayIso()));
      setErrors({});
      create.reset();
      update.reset();
    }
  }

  const mutation = movement ? update : create;
  const server = splitFieldErrors(mutation.error, ['type', 'date', 'amount', 'note'] as const);
  const set = <K extends keyof MovementFormValues>(key: K, value: MovementFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = () => {
    const found = validateMovement(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const request = movementFormToRequest(values);
    const done = () => {
      toast.success(
        t(movement ? 'donationFunds.toast.movementUpdated' : 'donationFunds.toast.movementCreated'),
      );
      onClose();
    };
    if (movement)
      update.mutate({ ...request, fundId, movementId: movement.id }, { onSuccess: done });
    else create.mutate({ ...request, fundId }, { onSuccess: done });
  };

  return (
    <>
      <BottomSheet
        visible={visible && !confirming}
        onClose={onClose}
        title={
          movement ? t('donationFunds.movement.editTitle') : t('donationFunds.movement.newTitle')
        }
        actionLabel={t('common.save')}
        onAction={submit}
        actionLoading={mutation.isPending}
      >
        <Text variant="label" muted style={styles.intro}>
          {t('donationFunds.movement.onHand', { amount: formatMoney(onHand) })}
        </Text>
        <FormError messages={server.rest.length ? server.rest : undefined} />
        <Labeled
          label={t('donationFunds.movement.type')}
          hint={t(
            values.type === 'Use'
              ? 'donationFunds.movement.useHint'
              : 'donationFunds.movement.returnHint',
          )}
        >
          <SegmentedControl<FundMovementType>
            accessibilityLabel={t('donationFunds.movement.type')}
            segments={[
              { value: 'Use', label: enumLabel('fundMovementType', 'Use') },
              { value: 'Return', label: enumLabel('fundMovementType', 'Return') },
            ]}
            value={values.type}
            onChange={(v) => set('type', v)}
          />
        </Labeled>
        <View style={styles.row}>
          <View style={styles.flex}>
            <DateField
              label={t('donationFunds.fields.date')}
              value={values.date}
              onChange={(v) => set('date', v)}
              error={errors.date ?? server.fields.date}
            />
          </View>
        </View>
        <Labeled label={t('donationFunds.fields.amount')}>
          <AmountField
            variant="inline"
            currency="TRY"
            label={t('donationFunds.fields.amount')}
            value={values.amount}
            onChangeValue={(v) => set('amount', v)}
            error={errors.amount ?? server.fields.amount}
          />
        </Labeled>
        <TextField
          label={t('donations.fields.note')}
          placeholder={t('donations.form.optional')}
          value={values.note}
          onChangeText={(v) => set('note', v)}
          maxLength={200}
          error={errors.note ?? server.fields.note}
        />
        {movement && canDelete ? (
          <Button
            title={t('donationFunds.movement.delete')}
            variant="danger"
            onPress={() => setConfirming(true)}
          />
        ) : null}
      </BottomSheet>
      <ConfirmDialog
        visible={confirming}
        title={t('donationFunds.movement.deleteTitle')}
        confirmLabel={t('common.delete')}
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          if (!movement) return;
          remove.mutate(
            { fundId, movementId: movement.id },
            {
              onSuccess: () => {
                setConfirming(false);
                toast.success(t('donationFunds.toast.movementDeleted'));
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
  intro: { paddingHorizontal: Spacing.xs },
  row: { flexDirection: 'row', gap: Spacing.md },
  flex: { flex: 1 },
}));
