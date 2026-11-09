import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AmountField, BottomSheet, Button, FormError, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { amountToInput, parseAmountInput } from '@/lib/format/amountInput';
import { monthName } from '@/lib/format/period';
import { toast } from '@/stores/toastStore';

import { useSetLedgerMonthlyAmount } from '../hooks';
import type { MonthLine } from '../yearView';

/**
 * Elle kalemin bir ay hücresini yazar (Ledger.Update). Boş bırakıp kaydetmek ya da "Temizle" hücreyi
 * "girilmemiş" yapar. Kalemin kendisini düzenlemek için ayrı ekrana geçilir.
 */
export function LedgerCellSheet({
  line,
  year,
  month,
  onClose,
  onEditItem,
}: {
  /** null: kapalı. */
  line: MonthLine | null;
  year: number;
  month: number;
  onClose: () => void;
  onEditItem?: (itemId: number) => void;
}) {
  const { t } = useTranslation();
  const setAmount = useSetLedgerMonthlyAmount();
  const [raw, setRaw] = useState('');
  // Her açılışta hücrenin kayıtlı değeriyle başla (render sırasında türetilen durum).
  const [openKey, setOpenKey] = useState<string | null>(null);
  const key = line ? `${line.key}-${year}-${month}` : null;
  if (key !== openKey) {
    setOpenKey(key);
    setRaw(line ? amountToInput(line.amount, 'TRY') : '');
  }

  const itemId = line?.row.id ?? null;
  const save = (amount: number | null) => {
    if (itemId === null) return;
    setAmount.mutate(
      { itemId, year, month, amount },
      {
        onSuccess: () => {
          toast.success(t('ledger.cellSaved'));
          close();
        },
      },
    );
  };

  const close = () => {
    setAmount.reset();
    onClose();
  };

  return (
    <BottomSheet
      visible={!!line}
      onClose={close}
      title={line ? `${line.row.name} · ${monthName(month)} ${year}` : undefined}
      actionLabel={t('common.save')}
      onAction={() => save(parseAmountInput(raw))}
      actionLoading={setAmount.isPending}
    >
      <View style={{ gap: Spacing.sm }}>
        <FormError messages={setAmount.error?.messages} />
        <AmountField
          value={raw}
          onChangeValue={setRaw}
          currency="TRY"
          label={t('ledger.cellAmount')}
          autoFocus
        />
        <Text variant="caption" muted style={{ textAlign: 'center' }}>
          {t('ledger.cellHint')}
        </Text>
        {line?.amount !== null && line?.amount !== undefined ? (
          <Button
            title={t('ledger.clearCell')}
            variant="ghost"
            icon="backspace"
            disabled={setAmount.isPending}
            onPress={() => save(null)}
          />
        ) : null}
        {onEditItem && itemId !== null ? (
          <Button
            title={t('ledger.editItem')}
            variant="ghost"
            icon="edit"
            onPress={() => onEditItem(itemId)}
          />
        ) : null}
      </View>
    </BottomSheet>
  );
}
