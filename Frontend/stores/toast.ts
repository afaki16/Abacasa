import { defineStore } from 'pinia'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  title: string
  messages: string[]
  duration: number
}

let idCounter = 0

export const useToastStore = defineStore('toast', {
  state: () => ({
    items: [] as ToastItem[],
  }),

  actions: {
    add(type: ToastType, messages: string | string[], title?: string, duration?: number) {
      const msgArray = Array.isArray(messages) ? messages : [messages]
      if (msgArray.length === 0) return

      // Aynı içerikli toast hâlâ ekrandaysa tekrar basma — API katmanı ve
      // sayfa catch'i aynı hatayı art arda gösterdiğinde çift bildirim oluşuyor.
      const key = msgArray.join('\n')
      if (this.items.some((t) => t.type === type && t.messages.join('\n') === key)) return

      const id = `toast_${++idCounter}_${Date.now()}`
      const dur = duration ?? (type === 'error' ? 8000 : 4000)

      this.items.push({ id, type, title: title || '', messages: msgArray, duration: dur })

      if (dur > 0) {
        setTimeout(() => this.remove(id), dur)
      }
    },

    remove(id: string) {
      this.items = this.items.filter((t) => t.id !== id)
    },

    clear() {
      this.items = []
    },
  },
})
