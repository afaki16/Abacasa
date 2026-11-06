<template>
  <UiDialog
    :model-value="modelValue"
    :max-width="maxWidth"
    :persistent="persistent"
    content-class="modern-confirm-dialog"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="confirm-card">
      <!-- Header -->
      <div class="confirm-header" :class="`confirm-header--${type}`">
        <div class="header-content">
          <div class="icon-container" :class="`icon-container--${type}`">
            <UiIcon :icon="icon" class="confirm-icon" :size="32" />
          </div>
          <div class="header-text">
            <h2 class="confirm-title">{{ title ?? t('common.confirmTitle') }}</h2>
            <p class="confirm-message">{{ message }}</p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="confirm-actions" :class="`confirm-actions--${type}`">
        <UiBtn
          v-if="type === 'error' || type === 'info'"
          variant="outlined"
          :disabled="loading"
          @click="$emit('cancel')"
          class="cancel-btn"
        >
          {{ cancelText ?? t('common.cancel') }}
        </UiBtn>
        <UiBtn
          :color="confirmColor"
          :loading="loading"
          @click="$emit('confirm')"
          class="confirm-btn"
          :class="`confirm-btn--${type}`"
        >
          {{ type === 'warning' || type === 'success' ? t('common.ok') : (confirmText ?? t('common.confirm')) }}
        </UiBtn>
      </div>
    </div>
  </UiDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props
const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'error' | 'success'
  maxWidth?: string | number
  persistent?: boolean
  loading?: boolean
}>(), {
  title: undefined,
  confirmText: undefined,
  cancelText: undefined,
  type: 'info',
  maxWidth: 480,
  persistent: false,
  loading: false
})

const { t } = useI18n()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

// Computed
const icon = computed(() => {
  switch (props.type) {
    case 'warning': return 'mdi-alert'
    case 'error': return 'mdi-alert-circle'
    case 'success': return 'mdi-check-circle'
    default: return 'mdi-help-circle'
  }
})

const confirmColor = computed(() => {
  switch (props.type) {
    case 'error': return 'error'
    case 'warning': return 'warning'
    case 'success': return 'success'
    default: return 'primary'
  }
})
</script>

<style scoped>
.confirm-card {
  border-radius: 20px !important;
  overflow: hidden;
  background: rgb(var(--color-surface)) !important;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.15) !important;
}

/* Header Styles */
.confirm-header {
  padding: 32px 32px 24px 32px;
  position: relative;
  overflow: hidden;
}

.confirm-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.05;
  z-index: 1;
}

.confirm-header--info::before {
  background: var(--theme-gradient);
}

.confirm-header--warning::before {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.confirm-header--error::before {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.confirm-header--success::before {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.header-content {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  position: relative;
  z-index: 2;
}

.icon-container {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.icon-container::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  opacity: 0.1;
}

.icon-container--info {
  background: rgb(var(--color-primary) / 0.1);
  border: 2px solid rgb(var(--color-primary) / 0.2);
}

.icon-container--info::before {
  background: var(--theme-gradient);
}

.icon-container--warning {
  background: rgba(245, 158, 11, 0.1);
  border: 2px solid rgba(245, 158, 11, 0.2);
}

.icon-container--warning::before {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.icon-container--error {
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid rgba(239, 68, 68, 0.2);
}

.icon-container--error::before {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.icon-container--success {
  background: rgba(16, 185, 129, 0.1);
  border: 2px solid rgba(16, 185, 129, 0.2);
}

.icon-container--success::before {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.confirm-icon {
  z-index: 1;
  position: relative;
}

.icon-container--info .confirm-icon {
  color: rgb(var(--color-primary));
}

.icon-container--warning .confirm-icon {
  color: #f59e0b;
}

.icon-container--error .confirm-icon {
  color: #ef4444;
}

.icon-container--success .confirm-icon {
  color: #10b981;
}

.header-text {
  flex: 1;
  min-width: 0;
}

.confirm-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(var(--color-on-surface));
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.confirm-message {
  font-size: 1rem;
  color: rgb(var(--color-on-surface-variant));
  margin: 0;
  line-height: 1.5;
}

/* Actions */
.confirm-actions {
  padding: 24px 32px 32px 32px;
  display: flex;
  gap: 16px;
}

.confirm-actions--error,
.confirm-actions--info {
  justify-content: space-between;
}

.confirm-actions--warning,
.confirm-actions--success {
  justify-content: flex-end;
}

/* Dernify: yuvarlak, kompakt butonlar; İptal açık kenarlıklı, onay düz renk */
.cancel-btn,
.confirm-btn {
  height: 44px !important;
  padding: 0 24px !important;
  border-radius: 999px !important;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
}

.cancel-btn {
  color: rgb(var(--color-on-surface-variant)) !important;
  border: 1px solid rgb(var(--color-outline-variant)) !important;
  background: transparent !important;
}
.cancel-btn:hover {
  background: rgb(var(--color-surface-container-high)) !important;
}

.confirm-btn {
  color: #fff !important;
  box-shadow: none;
  transition: filter 0.15s ease;
}

.confirm-btn:hover {
  filter: brightness(0.95);
}

.confirm-btn--info {
  background: rgb(var(--color-primary)) !important;
}

.confirm-btn--warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
}

.confirm-btn--error {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
}

.confirm-btn--success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .confirm-header {
    padding: 24px 24px 20px 24px;
  }
  
  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .icon-container {
    align-self: center;
    width: 56px;
    height: 56px;
  }
  
  .confirm-icon {
    font-size: 28px !important;
  }
  
  .confirm-title {
    font-size: 1.25rem;
  }
  
  .confirm-message {
    font-size: 0.9rem;
  }
  
  .confirm-actions {
    padding: 20px 24px 24px 24px;
    flex-direction: column-reverse;
    gap: 12px;
  }
  
  .confirm-actions--error,
  .confirm-actions--info {
    justify-content: stretch;
  }
  
  .confirm-actions--warning,
  .confirm-actions--success {
    justify-content: stretch;
  }
  
  .cancel-btn,
  .confirm-btn {
    width: 100%;
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .confirm-header {
    padding: 20px 20px 16px 20px;
  }
  
  .confirm-actions {
    padding: 16px 20px 20px 20px;
  }
}
</style>