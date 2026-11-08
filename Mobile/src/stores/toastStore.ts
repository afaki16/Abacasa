// Global toast (Bilesenler · 7): kısa geri bildirim + isteğe bağlı eylem ("Geri al").
// Aynı anda tek toast gösterilir; yenisi eskisinin yerini alır. Gösterimi kök layout'taki
// ToastHost yapar; ekran dışı kod da (mutation onSuccess) toast.success(...) çağırabilir.

import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface Toast {
  /** Her gösterimde artar; zamanlayıcı yalnızca kendi toast'ını kapatır. */
  id: number;
  message: string;
  variant: ToastVariant;
  action?: ToastAction;
  /** Ekranda kalma süresi (ms). */
  duration: number;
}

export interface ToastOptions {
  action?: ToastAction;
  duration?: number;
}

/** Eylemli toast'a dokunacak vakit kalsın diye daha uzun. */
export const TOAST_DURATION = 4000;
export const TOAST_DURATION_WITH_ACTION = 6000;

interface ToastState {
  current: Toast | null;
  show: (message: string, variant?: ToastVariant, options?: ToastOptions) => number;
  /** id verilirse yalnızca o toast hâlâ ekrandaysa kapatır (eski zamanlayıcı yenisini kapatmasın). */
  hide: (id?: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  current: null,
  show: (message, variant = 'info', options) => {
    const id = nextId++;
    set({
      current: {
        id,
        message,
        variant,
        action: options?.action,
        duration: options?.duration ?? (options?.action ? TOAST_DURATION_WITH_ACTION : TOAST_DURATION),
      },
    });
    return id;
  },
  hide: (id) => {
    const current = get().current;
    if (!current || (id !== undefined && current.id !== id)) return;
    set({ current: null });
  },
}));

/** Kısa yol: toast.success('Harcama kaydedildi', { action: { label: 'Geri al', onPress } }). */
export const toast = {
  success: (message: string, options?: ToastOptions) => useToastStore.getState().show(message, 'success', options),
  error: (message: string, options?: ToastOptions) => useToastStore.getState().show(message, 'error', options),
  info: (message: string, options?: ToastOptions) => useToastStore.getState().show(message, 'info', options),
  hide: (id?: number) => useToastStore.getState().hide(id),
};
