// Elle kalem kaydı: kalem (oluştur/güncelle) + değişen aylık hücreler sırayla yazılır.
// Hücre uçları ayrı olduğu için tek mutation değildir; hata olursa form üstünde gösterilir ve tekrar
// denemede (oluşturma yarıda kaldıysa) aynı kalem güncellenir, ikinci kez oluşturulmaz.

import { useRef, useState } from 'react';

import { type ApiError, isApiError } from '@/lib/api';

import { useCreateLedgerItem, useSetLedgerMonthlyAmount, useUpdateLedgerItem } from './hooks';
import { changedMonths } from './itemForm';
import type { LedgerItem } from './types';
import type { LedgerItemFormSubmit } from './components/LedgerItemForm';

export function useLedgerItemSave() {
  const create = useCreateLedgerItem();
  const update = useUpdateLedgerItem();
  const setAmount = useSetLedgerMonthlyAmount();
  const createdId = useRef<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  /** Başarıda kalemi döner; hatada null (error dolar). */
  const save = async ({
    item,
    year,
    original,
    values,
    canEditAmounts,
  }: {
    item?: LedgerItem;
    year: number;
    original: (number | null)[];
    values: LedgerItemFormSubmit;
    canEditAmounts: boolean;
  }): Promise<LedgerItem | null> => {
    setPending(true);
    setError(null);
    try {
      const body = {
        name: values.name,
        direction: values.direction,
        ownerPersonId: values.ownerPersonId,
      };
      const existingId = item?.id ?? createdId.current;
      const saved =
        existingId !== null
          ? await update.mutateAsync({
              ...body,
              id: existingId,
              isActive: item ? values.isActive : true,
            })
          : await create.mutateAsync(body);
      createdId.current = saved.id;
      if (canEditAmounts) {
        for (const change of changedMonths(original, values.months)) {
          await setAmount.mutateAsync({
            itemId: saved.id,
            year,
            month: change.month,
            amount: change.amount,
          });
          // Yazılan hücre bir sonraki denemede yeniden gönderilmesin.
          original[change.month - 1] = change.amount;
        }
      }
      return saved;
    } catch (e) {
      if (isApiError(e)) setError(e);
      return null;
    } finally {
      setPending(false);
    }
  };

  return { save, pending, error };
}
