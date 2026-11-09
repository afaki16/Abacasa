// Seçili dönem: Özet, Harcamalar ve Kategoriye göre ekranları aynı dönemi gösterir (bellekte; uygulama
// yeniden açılınca bu ay). Seçim haneye bağlıdır: hane değişince bu aya döner (kart başka hanenin olabilir).

import { useMemo } from 'react';
import { create } from 'zustand';

import { todayIso } from '@/lib/format/period';
import { useAuthStore } from '@/stores/authStore';

import { resolvePeriod, selectionForToday, shiftSelection, type PeriodSelection, type StatementCard } from './periodSelection';

interface PeriodState {
  selection: PeriodSelection | null;
  /** Seçimin ait olduğu hane. */
  tenantId: number | null;
  set: (selection: PeriodSelection, tenantId: number | null) => void;
}

export const usePeriodStore = create<PeriodState>((set) => ({
  selection: null,
  tenantId: null,
  set: (selection, tenantId) => set({ selection, tenantId }),
}));

/** Etkin hanenin seçili dönemi ve değiştiricileri. */
export function useSelectedPeriod() {
  const tenantId = useAuthStore((s) => s.user?.activeTenant?.id ?? null);
  const stored = usePeriodStore((s) => s.selection);
  const storedTenant = usePeriodStore((s) => s.tenantId);
  const setStored = usePeriodStore((s) => s.set);

  const selection = useMemo(
    () => (stored && storedTenant === tenantId ? stored : selectionForToday(todayIso())),
    [stored, storedTenant, tenantId],
  );
  const period = useMemo(() => resolvePeriod(selection), [selection]);

  return {
    selection,
    period,
    shift: (n: number) => setStored(shiftSelection(selection, n), tenantId),
    /** Takvim ayına ya da bir kartın dönemine geçer; bugünü içeren dönemden başlar. */
    setCard: (card: StatementCard | null) => setStored(selectionForToday(todayIso(), card), tenantId),
    reset: () => setStored(selectionForToday(todayIso(), selection.card), tenantId),
  };
}
