<template>
  <div class="app-toast-container">
    <TransitionGroup name="app-toast">
      <div
        v-for="item in toastStore.items"
        :key="item.id"
        :class="['app-toast-item', `app-toast-${item.type}`]"
      >
        <div class="app-toast-accent" />

        <div class="app-toast-icon">
          <Icon :name="iconMap[item.type]" class="w-5 h-5" />
        </div>

        <div class="app-toast-body">
          <span class="app-toast-title">{{ item.title || t(`toast.${item.type}`) }}</span>
          <ul v-if="item.messages.length > 1" class="app-toast-messages">
            <li v-for="(msg, i) in item.messages" :key="i">{{ msg }}</li>
          </ul>
          <p v-else class="app-toast-message">{{ item.messages[0] }}</p>
        </div>

        <button class="app-toast-close" @click="toastStore.remove(item.id)">
          <Icon name="mdi:close" class="w-4 h-4" />
        </button>

        <div
          v-if="item.duration > 0"
          class="app-toast-progress"
          :style="{ animationDuration: `${item.duration}ms` }"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToastStore } from '~/stores/toast'

const toastStore = useToastStore()
const { t } = useI18n()

const iconMap: Record<string, string> = {
  success: 'mdi:check-circle-outline',
  error: 'mdi:alert-circle-outline',
  warning: 'mdi:alert-outline',
  info: 'mdi:information-outline',
}
</script>

<style>
.app-toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
  max-width: 420px;
  width: calc(100% - 48px);
}

.app-toast-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(24px);
  border: 1px solid #e8edf3;
  box-shadow:
    0 12px 36px rgba(15, 23, 42, 0.14),
    0 2px 8px rgba(15, 23, 42, 0.06);
  overflow: hidden;
  pointer-events: all;
  font-family: 'Inter', sans-serif;
}

.app-toast-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 4px 0 0 4px;
}

.app-toast-success .app-toast-accent { background: linear-gradient(180deg, #34d399, #10b981); }
.app-toast-error   .app-toast-accent { background: linear-gradient(180deg, #f87171, #ef4444); }
.app-toast-warning .app-toast-accent { background: linear-gradient(180deg, #fbbf24, #f59e0b); }
.app-toast-info    .app-toast-accent { background: var(--theme-gradient, linear-gradient(180deg, #818cf8, #6366f1)); }

.app-toast-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-toast-success .app-toast-icon { background: #ecfdf5; color: #059669; }
.app-toast-error   .app-toast-icon { background: #fef2f2; color: #dc2626; }
.app-toast-warning .app-toast-icon { background: #fffbeb; color: #d97706; }
.app-toast-info    .app-toast-icon {
  background: color-mix(in srgb, rgb(var(--color-primary)) 10%, white);
  color: rgb(var(--color-primary));
}

.app-toast-body {
  flex: 1;
  min-width: 0;
}

.app-toast-title {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
  letter-spacing: 0.2px;
}

.app-toast-message {
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
}

.app-toast-messages {
  list-style: none;
  padding: 0;
  margin: 0;
}

.app-toast-messages li {
  position: relative;
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.55;
  padding-left: 14px;
}

.app-toast-messages li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.app-toast-success .app-toast-messages li::before { background: #10b981; }
.app-toast-error   .app-toast-messages li::before { background: #ef4444; }
.app-toast-warning .app-toast-messages li::before { background: #f59e0b; }
.app-toast-info    .app-toast-messages li::before { background: rgb(var(--color-primary)); }

.app-toast-close {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
}

.app-toast-close:hover {
  background: #f1f5f9;
  color: #475569;
}

.app-toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  border-radius: 0 0 0 14px;
  animation: appToastShrink linear forwards;
}

.app-toast-success .app-toast-progress { background: #10b981; }
.app-toast-error   .app-toast-progress { background: #ef4444; }
.app-toast-warning .app-toast-progress { background: #f59e0b; }
.app-toast-info    .app-toast-progress { background: rgb(var(--color-primary)); }

@keyframes appToastShrink {
  from { width: 100%; }
  to   { width: 0%; }
}

.app-toast-enter-active {
  animation: appToastSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.app-toast-leave-active {
  animation: appToastSlideOut 0.3s cubic-bezier(0.4, 0, 1, 1) forwards;
}

@keyframes appToastSlideIn {
  from {
    opacity: 0;
    transform: translateX(40px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes appToastSlideOut {
  from {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(40px) scale(0.96);
  }
}

@media (max-width: 480px) {
  .app-toast-container {
    top: 12px;
    right: 12px;
    left: 12px;
    max-width: none;
    width: auto;
  }
}
</style>
