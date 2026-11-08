// Araç işlemi gövdesi (saf fonksiyon) — web VehicleObligationsDialog.save ile aynı kurallar.

import type { SaveVehicleObligationRequest, VehicleObligation, VehicleObligationFormValues } from './types';

/**
 * Form değerlerini gövdeye çevirir:
 * - Bağlı canlı harcaması olan işlemde createExpense gönderilmez (backend zaten yok sayar).
 * - Kategori ve ödeme aracı yalnızca harcama oluşturulacaksa gönderilir.
 * - Boş tutar ve not gönderilmez.
 */
export function buildObligationRequest(
  form: VehicleObligationFormValues,
  editing?: Pick<VehicleObligation, 'hasExpense'> | null,
): SaveVehicleObligationRequest {
  const createExpense = !editing?.hasExpense && form.createExpense;
  return {
    type: form.type,
    date: form.date,
    validUntil: form.validUntil,
    amount: form.amount ?? undefined,
    note: form.note?.trim() || undefined,
    createExpense,
    categoryId: createExpense ? (form.categoryId ?? undefined) : undefined,
    paymentMethodId: createExpense ? (form.paymentMethodId ?? undefined) : undefined,
  };
}
